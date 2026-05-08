import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUserApi } from "@/lib/auth-server";

export const runtime = "nodejs";

const PAGE_SIZE = 50;

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
