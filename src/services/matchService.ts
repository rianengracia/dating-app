import { request } from "./http";

export type MatchSummary = {
  matchId: string;
  partner: {
    id: string;
    displayName: string;
    photoUrl: string;
    age: number;
    bio: string;
  };
  lastMessage: { body: string; senderId: string; createdAt: string } | null;
  createdAt: string;
};

export const matchService = {
  list(): Promise<{ matches: MatchSummary[] }> {
    return request<{ matches: MatchSummary[] }>({ url: "/api/matches", method: "GET" });
  },

  unmatch(id: string): Promise<void> {
    return request<void>({
      url: `/api/matches/${encodeURIComponent(id)}`,
      method: "DELETE",
    });
  },
};
