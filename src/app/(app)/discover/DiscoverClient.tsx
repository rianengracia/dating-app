"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useDiscover } from "@/hooks/useDiscover";
import { useSwipe } from "@/hooks/useSwipe";
import type { Candidate, DiscoverFilters } from "@/services/discoverService";

const DEFAULT_FILTERS: DiscoverFilters = { minAge: 18, maxAge: 99, maxKm: null };

export function DiscoverClient() {
  const router = useRouter();
  const {
    candidates,
    loading,
    error,
    filters,
    setFilters,
    removeTop,
  } = useDiscover(DEFAULT_FILTERS);
  const { pending, lastMatch, like, skip, clearMatch } = useSwipe();

  const top = candidates[0];

  async function onSwipe(action: "LIKE" | "SKIP") {
    if (!top || pending) return;
    const result = action === "LIKE" ? await like(top.id) : await skip(top.id);
    if (result) removeTop();
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (lastMatch) return;
      if (e.key === "ArrowRight") void onSwipe("LIKE");
      if (e.key === "ArrowLeft") void onSwipe("SKIP");
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [top?.id, lastMatch, pending]);

  return (
    <div className="mx-auto max-w-275 px-6 md:px-12 py-10 md:py-14 grid lg:grid-cols-[280px_1fr] gap-8">
      <FilterBar filters={filters} onChange={setFilters} />

      <section className="space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="tm-rule" />
              <span className="tm-mono text-[11px] text-accent">LOBBY // SCAN</span>
            </div>
            <h1 className="tm-display text-3xl md:text-4xl mt-2">Pick your duo</h1>
          </div>
          <span className="tm-mono text-[10px] text-fg-dim">
            {loading ? "LOADING..." : `${candidates.length} CANDIDATES IN QUEUE`}
          </span>
        </header>

        {error && (
          <div className="border border-accent bg-accent/10 px-4 py-3 tm-mono text-xs text-accent tm-clip-tl">
            ▸ {error}
          </div>
        )}

        {!loading && !top && !error && (
          <EmptyState onReset={() => setFilters(DEFAULT_FILTERS)} />
        )}

        {top && (
          <SwipeCard
            key={top.id}
            candidate={top}
            disabled={pending}
            onLike={() => onSwipe("LIKE")}
            onSkip={() => onSwipe("SKIP")}
          />
        )}
      </section>

      {lastMatch && (
        <MatchOverlay
          match={lastMatch}
          onDismiss={() => clearMatch()}
          onOpen={() => router.push(`/match/${lastMatch.matchId}`)}
        />
      )}
    </div>
  );
}

function FilterBar({
  filters,
  onChange,
}: {
  filters: DiscoverFilters;
  onChange: (next: DiscoverFilters) => void;
}) {
  return (
    <aside className="bg-surface border border-line tm-clip-br p-5 space-y-5 h-fit relative">
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-linear-to-r from-accent to-transparent" />
      <div>
        <div className="tm-mono text-[10px] text-fg-dim mb-1">FILTERS</div>
        <div className="tm-display text-xl">Loadout</div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between tm-mono text-[10px]">
          <span className="text-fg-muted">AGE</span>
          <span className="text-fg">
            {filters.minAge} – {filters.maxAge}
          </span>
        </div>
        <div className="flex gap-2">
          <input
            type="number"
            min={18}
            max={99}
            value={filters.minAge}
            aria-label="Minimum age"
            onChange={(e) =>
              onChange({ ...filters, minAge: clamp(Number(e.currentTarget.value), 18, filters.maxAge) })
            }
            className="w-1/2 bg-surface-2 border border-line text-fg h-9 px-2 tm-mono text-xs tm-clip-tl"
          />
          <input
            type="number"
            min={18}
            max={99}
            value={filters.maxAge}
            aria-label="Maximum age"
            onChange={(e) =>
              onChange({ ...filters, maxAge: clamp(Number(e.currentTarget.value), filters.minAge, 99) })
            }
            className="w-1/2 bg-surface-2 border border-line text-fg h-9 px-2 tm-mono text-xs tm-clip-tl"
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between tm-mono text-[10px]">
          <span className="text-fg-muted">DISTANCE (KM)</span>
          <span className="text-fg">{filters.maxKm === null ? "ANY" : filters.maxKm}</span>
        </div>
        <input
          type="range"
          min={1}
          max={500}
          value={filters.maxKm ?? 500}
          aria-label="Maximum distance"
          onChange={(e) => onChange({ ...filters, maxKm: Number(e.currentTarget.value) })}
          className="w-full accent-(--tm-accent)"
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onChange({ ...filters, maxKm: null })}
            className="tm-mono text-[10px] text-fg-muted hover:text-fg border border-line px-2 py-1 tm-clip-tl"
          >
            ANY
          </button>
          {[10, 25, 100].map((km) => (
            <button
              key={km}
              type="button"
              onClick={() => onChange({ ...filters, maxKm: km })}
              className="tm-mono text-[10px] text-fg-muted hover:text-fg border border-line px-2 py-1 tm-clip-tl"
            >
              {km} KM
            </button>
          ))}
        </div>
      </div>

      <p className="tm-mono text-[10px] text-fg-dim leading-relaxed">
        ◐ KEYBOARD: ← SKIP // → LIKE
      </p>
    </aside>
  );
}

function clamp(n: number, min: number, max: number): number {
  if (Number.isNaN(n)) return min;
  return Math.max(min, Math.min(max, Math.trunc(n)));
}

function SwipeCard({
  candidate,
  disabled,
  onLike,
  onSkip,
}: {
  candidate: Candidate;
  disabled: boolean;
  onLike: () => void;
  onSkip: () => void;
}) {
  const [drag, setDrag] = useState(0);
  const startX = useRef<number | null>(null);

  function onPointerDown(e: React.PointerEvent) {
    startX.current = e.clientX;
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
  }
  function onPointerMove(e: React.PointerEvent) {
    if (startX.current === null) return;
    setDrag(e.clientX - startX.current);
  }
  function onPointerUp() {
    if (drag > 120) onLike();
    else if (drag < -120) onSkip();
    setDrag(0);
    startX.current = null;
  }

  const rot = drag / 20;
  const tint =
    drag > 40 ? "ring-2 ring-success" : drag < -40 ? "ring-2 ring-accent" : "";

  return (
    <div className="space-y-4">
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{ transform: `translateX(${drag}px) rotate(${rot}deg)` }}
        className={`bg-surface border border-line tm-clip-br relative cursor-grab active:cursor-grabbing transition-transform ${tint}`}
      >
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-linear-to-r from-accent to-transparent z-10" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={candidate.photoUrl}
          alt={candidate.displayName}
          draggable={false}
          className="w-full aspect-4/5 object-cover tm-clip-br pointer-events-none select-none"
        />
        <div className="absolute inset-x-0 bottom-0 p-6 bg-linear-to-t from-[#0F1923] via-[#0F1923]/80 to-transparent space-y-3">
          <div className="flex items-baseline gap-3">
            <h2 className="tm-display text-3xl text-fg">{candidate.displayName.toUpperCase()}</h2>
            <span className="tm-mono text-sm text-fg-muted">{candidate.age}</span>
          </div>
          {candidate.distanceKm !== null && (
            <div className="tm-mono text-[10px] text-cyan">▸ {candidate.distanceKm} KM AWAY</div>
          )}
          <p className="text-sm text-fg leading-relaxed line-clamp-3">{candidate.bio}</p>
        </div>

        {drag > 40 && (
          <div className="absolute top-6 left-6 tm-display text-3xl text-success border-2 border-success px-3 py-1 -rotate-12">
            LIKE
          </div>
        )}
        {drag < -40 && (
          <div className="absolute top-6 right-6 tm-display text-3xl text-accent border-2 border-accent px-3 py-1 rotate-12">
            SKIP
          </div>
        )}
      </div>

      <div className="flex justify-center gap-4">
        <Button type="button" variant="secondary" size="lg" onClick={onSkip} disabled={disabled}>
          ◀ SKIP
        </Button>
        <Button type="button" variant="primary" size="lg" onClick={onLike} disabled={disabled}>
          LIKE ▶
        </Button>
      </div>
    </div>
  );
}

function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className="bg-surface border border-line tm-clip-br p-10 text-center space-y-4">
      <div className="tm-display text-3xl">Lobby empty</div>
      <p className="text-fg-muted">
        No candidates match your filters right now. Try widening your loadout.
      </p>
      <Button type="button" variant="secondary" size="md" onClick={onReset}>
        RESET FILTERS
      </Button>
    </div>
  );
}

function MatchOverlay({
  match,
  onDismiss,
  onOpen,
}: {
  match: { matchId: string; partner: { id: string; displayName: string; photoUrl: string } };
  onDismiss: () => void;
  onOpen: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="match-formed-title"
      className="fixed inset-0 z-50 bg-bg/95 backdrop-blur-sm flex items-center justify-center p-6"
    >
      <div className="max-w-md w-full bg-surface border border-accent tm-clip-br p-8 space-y-6 relative">
        <div className="absolute top-0 left-0 right-0 h-0.75 bg-accent" />
        <div className="flex items-center gap-3">
          <span className="tm-rule" />
          <span className="tm-mono text-[11px] text-accent">SPIKE PLANTED</span>
        </div>
        <h2 id="match-formed-title" className="tm-display text-5xl text-fg">MATCH FORMED</h2>
        <p className="text-fg-muted">
          You and{" "}
          <span className="tm-display text-2xl text-accent align-middle">
            {match.partner.displayName.toUpperCase()}
          </span>{" "}
          locked in mutual interest.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button type="button" variant="primary" size="md" onClick={onOpen}>
            OPEN CONVERSATION
          </Button>
          <Button type="button" variant="secondary" size="md" onClick={onDismiss}>
            KEEP SCANNING
          </Button>
        </div>
      </div>
    </div>
  );
}
