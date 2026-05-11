import Pusher from "pusher-js";
import type { ChatMessage } from "./messageService";

export type PresenceHandlers = {
  onSubscribed: () => void;
  onError: (reason?: unknown) => void;
  onMessage: (msg: ChatMessage) => void;
};

export const realtimeService = {
  subscribePresence(matchId: string, handlers: PresenceHandlers): () => void {
    const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
    if (!key || !cluster) {
      handlers.onError(new Error("Pusher env missing"));
      return () => {};
    }

    const pusher = new Pusher(key, {
      cluster,
      authEndpoint: "/api/pusher/auth",
    });
    const channelName = `presence-match-${matchId}`;
    const channel = pusher.subscribe(channelName);

    channel.bind("pusher:subscription_succeeded", () => handlers.onSubscribed());
    channel.bind("pusher:subscription_error", (reason: unknown) => handlers.onError(reason));
    channel.bind("message:new", (msg: ChatMessage) => handlers.onMessage(msg));

    return () => {
      pusher.unsubscribe(channelName);
      pusher.disconnect();
    };
  },
};
