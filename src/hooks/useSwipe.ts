"use client";

import { useCallback, useState } from "react";
import { swipeService, type SwipeAction, type SwipeResult } from "@/services/swipeService";

type LastMatch = {
  matchId: string;
  partner: { id: string; displayName: string; photoUrl: string };
};

export function useSwipe() {
  const [pending, setPending] = useState(false);
  const [lastMatch, setLastMatch] = useState<LastMatch | null>(null);

  const dispatch = useCallback(async (targetId: string, action: SwipeAction): Promise<SwipeResult | null> => {
    setPending(true);
    try {
      const result = await swipeService.swipe(targetId, action);
      if (result.matched && result.matchId && result.partner) {
        setLastMatch({ matchId: result.matchId, partner: result.partner });
      }
      return result;
    } catch {
      return null;
    } finally {
      setPending(false);
    }
  }, []);

  return {
    pending,
    lastMatch,
    like: (id: string) => dispatch(id, "LIKE"),
    skip: (id: string) => dispatch(id, "SKIP"),
    clearMatch: () => setLastMatch(null),
  };
}
