import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma, SwipeAction } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireUserApi } from "@/lib/auth-server";
import { canonicalPair } from "@/lib/match";
import { sendPush } from "@/lib/push";

export const runtime = "nodejs";

const swipeSchema = z.object({
  targetId: z.string().min(1),
  action: z.enum(["LIKE", "SKIP"]),
});

export async function POST(request: Request) {
  const auth = await requireUserApi();
  if (auth.response) return auth.response;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid body." }, { status: 400 });
  }
  const parsed = swipeSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid swipe." }, { status: 400 });
  }

  const me = auth.user;
  const { targetId, action } = parsed.data;
  if (targetId === me.id) {
    return NextResponse.json({ ok: false, error: "Cannot swipe self." }, { status: 400 });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      await tx.swipe.upsert({
        where: { swiperId_targetId: { swiperId: me.id, targetId } },
        update: { action: action as SwipeAction },
        create: { swiperId: me.id, targetId, action: action as SwipeAction },
      });

      if (action !== "LIKE") return { matched: false as const };

      const reciprocal = await tx.swipe.findUnique({
        where: { swiperId_targetId: { swiperId: targetId, targetId: me.id } },
        select: { action: true },
      });
      if (!reciprocal || reciprocal.action !== "LIKE") return { matched: false as const };

      const pair = canonicalPair(me.id, targetId);
      const match = await tx.match.upsert({
        where: { userAId_userBId: pair },
        update: {},
        create: pair,
        select: {
          id: true,
          userA: { select: { id: true, displayName: true, photoUrl: true, pushSubscription: true } },
          userB: { select: { id: true, displayName: true, photoUrl: true, pushSubscription: true } },
        },
      });
      return { matched: true as const, match };
    });

    if (result.matched) {
      const { match } = result;
      const other = match.userA.id === me.id ? match.userB : match.userA;
      // Fire-and-forget push to the other user.
      void sendPush(other.pushSubscription, {
        title: "New match",
        body: `You and ${me.displayName} matched.`,
        url: `/match/${match.id}`,
        tag: `match-${match.id}`,
      });
      return NextResponse.json({
        ok: true,
        matched: true,
        matchId: match.id,
        partner: { id: other.id, displayName: other.displayName, photoUrl: other.photoUrl },
      });
    }

    return NextResponse.json({ ok: true, matched: false });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2003") {
      return NextResponse.json({ ok: false, error: "Target user not found." }, { status: 404 });
    }
    console.error("swipe failed", err);
    return NextResponse.json({ ok: false, error: "Server error." }, { status: 500 });
  }
}
