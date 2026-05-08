import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUserPage } from "@/lib/auth-server";
import { Conversation } from "./Conversation";

type Params = { matchId: string };

export const metadata = { title: "TrueMatch — Conversation" };

export default async function MatchPage({ params }: { params: Promise<Params> }) {
  const me = await requireUserPage();
  const { matchId } = await params;

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    select: {
      id: true,
      createdAt: true,
      userA: { select: { id: true, displayName: true, photoUrl: true, age: true, bio: true } },
      userB: { select: { id: true, displayName: true, photoUrl: true, age: true, bio: true } },
    },
  });
  if (!match) notFound();
  const inMatch = match.userA.id === me.id || match.userB.id === me.id;
  if (!inMatch) redirect("/matches");

  const partner = match.userA.id === me.id ? match.userB : match.userA;

  const initialMessages = await prisma.message.findMany({
    where: { matchId },
    orderBy: { id: "desc" },
    take: 50,
    select: { id: true, senderId: true, body: true, createdAt: true },
  });

  const matchedOn = new Date(match.createdAt).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="mx-auto max-w-[900px] px-6 md:px-12 py-6 md:py-10 flex flex-col h-[calc(100vh-4rem)]">
      <header className="bg-surface border border-line tm-clip-br p-5 mb-4 relative">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-accent to-transparent" />
        <div className="flex items-start gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={partner.photoUrl}
            alt={partner.displayName}
            className="w-20 h-20 sm:w-24 sm:h-24 object-cover tm-clip-br border border-line shrink-0"
          />
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-baseline gap-3 flex-wrap">
              <h1 className="tm-display text-2xl sm:text-3xl text-fg truncate">
                {partner.displayName.toUpperCase()}
              </h1>
              <span className="tm-mono text-[11px] text-fg-muted">AGE {partner.age}</span>
            </div>
            <p className="text-sm text-fg-muted line-clamp-2">{partner.bio}</p>
            <div className="flex items-center gap-3 pt-1">
              <span className="tm-mono text-[10px] text-cyan">▸ MATCHED {matchedOn.toUpperCase()}</span>
              <Link
                href="/matches"
                className="tm-mono text-[10px] text-fg-muted hover:text-fg ml-auto"
              >
                ◂ ROSTER
              </Link>
            </div>
          </div>
        </div>
      </header>

      <Conversation
        matchId={matchId}
        meId={me.id}
        partner={partner}
        initialMessages={initialMessages.reverse().map((m) => ({
          ...m,
          createdAt: m.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
