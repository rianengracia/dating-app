"use client";

import { useCallback, useEffect, useState } from "react";
import { matchService, type MatchSummary } from "@/services/matchService";
import { ApiError } from "@/services/http";

export function useMatches() {
  const [matches, setMatches] = useState<MatchSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { matches } = await matchService.list();
      setMatches(matches);
    } catch (err) {
      setError(err instanceof ApiError && err.message ? err.message : "Could not load matches.");
      setMatches([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const unmatch = useCallback(async (id: string): Promise<boolean> => {
    try {
      await matchService.unmatch(id);
      setMatches((prev) => prev.filter((m) => m.matchId !== id));
      return true;
    } catch {
      return false;
    }
  }, []);

  return { matches, loading, error, unmatch, refresh: load };
}
