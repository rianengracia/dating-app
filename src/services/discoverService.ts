import { request } from "./http";

export type Candidate = {
  id: string;
  displayName: string;
  age: number;
  bio: string;
  photoUrl: string;
  distanceKm: number | null;
};

export type DiscoverFilters = {
  minAge: number;
  maxAge: number;
  maxKm: number | null;
};

export const discoverService = {
  list(filters: DiscoverFilters): Promise<{ candidates: Candidate[] }> {
    const params: Record<string, string> = {
      minAge: String(filters.minAge),
      maxAge: String(filters.maxAge),
    };
    if (filters.maxKm !== null) params.maxKm = String(filters.maxKm);

    return request<{ candidates: Candidate[] }>({
      url: "/api/discover",
      method: "GET",
      params,
    });
  },
};
