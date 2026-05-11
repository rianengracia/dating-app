"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useMatches } from "@/hooks/useMatches";

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}

export function MatchesClient() {
  const { matches, loading, error, unmatch } = useMatches();
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [working, setWorking] = useState<string | null>(null);

  async function onUnmatch(id: string) {
    setWorking(id);
    try {
      await unmatch(id);
    } finally {
      setWorking(null);
      setConfirmId(null);
    }
  }

  return (
    <div className="mx-auto max-w-[900px] px-6 md:px-12 py-10 md:py-14 space-y-8">
      <header className="space-y-3">
        <div className="flex items-center gap-3">
          <span className="tm-rule" />
          <span className="tm-mono text-[11px] text-accent">ROSTER // ACTIVE</span>
        </div>
        <h1 className="tm-display text-3xl md:text-4xl">Your matches</h1>
      </header>

      {error && (
        <div className="border border-accent bg-accent/10 px-4 py-3 tm-mono text-xs text-accent tm-clip-tl">
          ▸ {error}
        </div>
      )}

      {loading ? (
        <p className="tm-mono text-xs text-fg-dim">▸ LOADING ROSTER...</p>
      ) : matches.length === 0 ? (
        <div className="bg-surface border border-line tm-clip-br p-8 text-center space-y-4">
          <div className="tm-display text-2xl">No matches yet</div>
          <p className="text-fg-muted">
            Head to the lobby and start scanning. Mutual likes show up here.
          </p>
          <Button href="/discover" variant="primary" size="md">
            ENTER LOBBY
          </Button>
        </div>
      ) : (
        <ul className="space-y-3">
          {matches.map((m) => (
            <li key={m.matchId} className="relative group">
              <Link
                href={`/match/${m.matchId}`}
                className="block bg-surface border border-line hover:border-accent tm-clip-br p-4 pr-28 transition-colors"
              >
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-accent to-transparent" />
                <div className="flex items-center gap-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={m.partner.photoUrl}
                    alt={m.partner.displayName}
                    className="w-20 h-20 object-cover tm-clip-br border border-line shrink-0"
                  />
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="tm-display text-xl text-fg">
                        {m.partner.displayName.toUpperCase()}
                      </span>
                      <span className="tm-mono text-[10px] text-fg-muted">
                        AGE {m.partner.age}
                      </span>
                      {m.lastMessage && (
                        <span className="tm-mono text-[10px] text-fg-dim ml-auto">
                          {formatRelative(m.lastMessage.createdAt)}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-fg-dim line-clamp-1">{m.partner.bio}</p>
                    <p className="text-sm text-fg-muted truncate pt-1">
                      {m.lastMessage ? (
                        <>
                          <span className="text-fg-dim tm-mono text-[10px] mr-1">
                            {m.lastMessage.senderId === m.partner.id ? "▸" : "◂ YOU"}
                          </span>
                          {m.lastMessage.body}
                        </>
                      ) : (
                        <span className="italic text-fg-dim">No messages yet — open the round.</span>
                      )}
                    </p>
                  </div>
                  <span className="tm-mono text-[10px] text-cyan group-hover:text-accent shrink-0 hidden sm:block">
                    OPEN ▸
                  </span>
                </div>
              </Link>
              <button
                type="button"
                onClick={() => setConfirmId(m.matchId)}
                aria-label={`Unmatch ${m.partner.displayName}`}
                className="absolute top-3 right-3 z-10 tm-mono text-[10px] text-fg-dim hover:text-accent border border-line hover:border-accent px-2 py-1 bg-bg/60"
              >
                ✕ UNMATCH
              </button>
            </li>
          ))}
        </ul>
      )}

      {confirmId && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="unmatch-dialog-title"
          className="fixed inset-0 z-50 bg-bg/95 backdrop-blur-sm flex items-center justify-center p-6"
        >
          <div className="max-w-md w-full bg-surface border border-line tm-clip-br p-8 space-y-5 relative">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-accent" />
            <div className="flex items-center gap-3">
              <span className="tm-rule" />
              <span className="tm-mono text-[11px] text-accent">CONFIRM // UNMATCH</span>
            </div>
            <h2 id="unmatch-dialog-title" className="tm-display text-3xl">Unmatch?</h2>
            <p className="text-fg-muted">
              This will remove the match and all messages for both of you. This action
              can&apos;t be undone.
            </p>
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={() => onUnmatch(confirmId)}
                disabled={working === confirmId}
              >
                {working === confirmId ? "REMOVING..." : "UNMATCH"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={() => setConfirmId(null)}
              >
                CANCEL
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
