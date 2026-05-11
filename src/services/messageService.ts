import { request } from "./http";

export type ChatMessage = {
  id: string;
  matchId?: string;
  senderId: string;
  body: string;
  createdAt: string;
};

export const messageService = {
  list(
    matchId: string,
    cursor?: string
  ): Promise<{ messages: ChatMessage[]; nextCursor: string | null }> {
    return request<{ messages: ChatMessage[]; nextCursor: string | null }>({
      url: `/api/matches/${encodeURIComponent(matchId)}/messages`,
      method: "GET",
      params: cursor ? { cursor } : undefined,
    });
  },

  send(matchId: string, body: string): Promise<{ message: ChatMessage }> {
    return request<{ message: ChatMessage }>({
      url: `/api/matches/${encodeURIComponent(matchId)}/messages`,
      method: "POST",
      data: { body },
    });
  },
};
