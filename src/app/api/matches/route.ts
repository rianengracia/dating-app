import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUserApi } from "@/lib/auth-server";

export const runtime = "nodejs";

export type MatchSummary = {
  matchId: string;
  partner: { id: string; displayName: string; photoUrl: string; age: number; bio: string };
  lastMessage: { body: string; senderId: string; createdAt: string } | null;
  createdAt: string;
};

export async function GET() {
  const auth = await requireUserApi();
  if (auth.response) return auth.response;
  const me = auth.user;

  const matches = await prisma.match.findMany({
    where: { OR: [{ userAId: me.id }, { userBId: me.id }] },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      createdAt: true,
      userA: { select: { id: true, displayName: true, photoUrl: true, age: true, bio: true } },
      userB: { select: { id: true, displayName: true, photoUrl: true, age: true, bio: true } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { body: true, senderId: true, createdAt: true },
      },
    },
  });

  const out: MatchSummary[] = matches.map((m) => {
    const partner = m.userA.id === me.id ? m.userB : m.userA;
    const last = m.messages[0];
    return {
      matchId: m.id,
      partner,
      lastMessage: last
        ? { body: last.body, senderId: last.senderId, createdAt: last.createdAt.toISOString() }
        : null,
      createdAt: m.createdAt.toISOString(),
    };
  });

  return NextResponse.json({ ok: true, matches: out });
}
