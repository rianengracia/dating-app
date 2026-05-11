import { request } from "./http";

export const pushService = {
  getPublicKey(): Promise<{ publicKey: string }> {
    return request<{ publicKey: string }>({
      url: "/api/push/vapid-key",
      method: "GET",
    });
  },

  subscribe(subscription: unknown): Promise<void> {
    return request<void>({
      url: "/api/push/subscribe",
      method: "POST",
      data: subscription,
    });
  },

  unsubscribe(): Promise<void> {
    return request<void>({
      url: "/api/push/subscribe",
      method: "DELETE",
    });
  },
};
