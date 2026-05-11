import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUserApi } from "@/lib/auth-server";
import { getPusher, matchChannel } from "@/lib/pusher";
import { sendPush } from "@/lib/push";

export const runtime = "nodejs";

const PAGE_SIZE = 50;
const MIN_BODY = 1;
const MAX_BODY = 2000;

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireUserApi();
  if (auth.response) return auth.response;
  const me = auth.user;
  const { id } = await context.params;

  const match = await prisma.match.findUnique({
    where: { id },
    select: { userAId: true, userBId: true },
  });
  if (!match || (match.userAId !== me.id && match.userBId !== me.id)) {
    return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });
  }

  const url = new URL(request.url);
  const cursor = url.searchParams.get("cursor");

  const messages = await prisma.message.findMany({
    where: { matchId: id, ...(cursor ? { id: { lt: cursor } } : {}) },
    orderBy: { id: "desc" },
    take: PAGE_SIZE,
    select: { id: true, senderId: true, body: true, createdAt: true },
  });

  return NextResponse.json({
    ok: true,
    messages: messages
      .reverse()
      .map((m) => ({ ...m, createdAt: m.createdAt.toISOString() })),
    nextCursor: messages.length === PAGE_SIZE ? messages[0].id : null,
  });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireUserApi();
  if (auth.response) {
    console.log("[messages POST] unauthorized");
    return auth.response;
  }
  const me = auth.user;
  const { id } = await context.params;
  console.log("[messages POST] hit", { matchId: id, userId: me.id });

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON." }, { status: 400 });
  }

  const body =
    payload && typeof payload === "object" && "body" in payload
      ? String((payload as { body: unknown }).body ?? "")
      : "";
  const trimmed = body.trim();
  if (trimmed.length < MIN_BODY || trimmed.length > MAX_BODY) {
    console.log("[messages POST] invalid_body length=", trimmed.length);
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  const match = await prisma.match.findUnique({
    where: { id },
    select: { id: true, userAId: true, userBId: true },
  });
  if (!match) {
    console.log("[messages POST] match not found in DB:", id);
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }
  if (match.userAId !== me.id && match.userBId !== me.id) {
    console.log("[messages POST] forbidden — user not in match");
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const message = await prisma.message.create({
    data: { matchId: id, senderId: me.id, body: trimmed },
    select: { id: true, senderId: true, body: true, createdAt: true },
  });
  const outbound = {
    id: message.id,
    matchId: id,
    senderId: message.senderId,
    body: message.body,
    createdAt: message.createdAt.toISOString(),
  };

  const channel = matchChannel(id);
  const pusher = getPusher();
  await pusher.trigger(channel, "message:new", outbound);

  const otherId = match.userAId === me.id ? match.userBId : match.userAId;
  let otherInChannel = false;
  try {
    const res = await pusher.get({ path: `/channels/${channel}/users` });
    if (res.status === 200) {
      const json = (await res.json()) as { users?: { id: string }[] };
      otherInChannel = !!json.users?.some((u) => u.id === otherId);
    }
  } catch {
    // If presence lookup fails, fall through and send the push.
  }

  if (!otherInChannel) {
    const other = await prisma.user.findUnique({
      where: { id: otherId },
      select: { pushSubscription: true },
    });
    if (other?.pushSubscription) {
      await sendPush(other.pushSubscription, {
        title: me.displayName,
        body: trimmed.length > 80 ? trimmed.slice(0, 77) + "..." : trimmed,
        url: `/match/${id}`,
        tag: `msg-${id}`,
      });
    }
  }

  return NextResponse.json({ ok: true, message: outbound });
}
