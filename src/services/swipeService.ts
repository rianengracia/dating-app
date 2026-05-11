import { request } from "./http";

export type SwipeAction = "LIKE" | "SKIP";

export type SwipeResult = {
  matched: boolean;
  matchId?: string;
  partner?: { id: string; displayName: string; photoUrl: string };
};

export const swipeService = {
  swipe(targetId: string, action: SwipeAction): Promise<SwipeResult> {
    return request<SwipeResult>({
      url: "/api/swipe",
      method: "POST",
      data: { targetId, action },
    });
  },
};
