"use client";

import { useCallback, useEffect, useState } from "react";
import {
  discoverService,
  type Candidate,
  type DiscoverFilters,
} from "@/services/discoverService";
import { ApiError } from "@/services/http";

const DEFAULT_FILTERS: DiscoverFilters = { minAge: 18, maxAge: 99, maxKm: null };

export function useDiscover(initial: DiscoverFilters = DEFAULT_FILTERS) {
  const [filters, setFilters] = useState<DiscoverFilters>(initial);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (f: DiscoverFilters) => {
    setLoading(true);
    setError(null);
    try {
      const { candidates } = await discoverService.list(f);
      setCandidates(candidates);
    } catch (err) {
      const message =
        err instanceof ApiError && err.message
          ? err.message
          : "Could not load discover feed.";
      setError(message);
      setCandidates([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(filters);
  }, [filters, load]);

  const removeTop = useCallback(() => {
    setCandidates((prev) => prev.slice(1));
  }, []);

  return {
    candidates,
    loading,
    error,
    filters,
    setFilters,
    refresh: () => load(filters),
    removeTop,
  };
}
