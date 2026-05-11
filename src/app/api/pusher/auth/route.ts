import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUserApi } from "@/lib/auth-server";
import { getPusher, matchChannel } from "@/lib/pusher";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const auth = await requireUserApi();
  if (auth.response) return auth.response;
  const me = auth.user;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const socketId = String(form.get("socket_id") ?? "");
  const channelName = String(form.get("channel_name") ?? "");
  if (!socketId || !channelName.startsWith("presence-match-")) {
    return NextResponse.json({ error: "Bad channel." }, { status: 400 });
  }

  const matchId = channelName.slice("presence-match-".length);
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    select: { id: true, userAId: true, userBId: true },
  });
  if (!match || (match.userAId !== me.id && match.userBId !== me.id)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const authResponse = getPusher().authorizeChannel(socketId, matchChannel(matchId), {
    user_id: me.id,
    user_info: { displayName: me.displayName },
  });
  return NextResponse.json(authResponse);
}
