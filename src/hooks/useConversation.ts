"use client";

import { useCallback, useEffect, useState } from "react";
import { messageService, type ChatMessage } from "@/services/messageService";
import { realtimeService } from "@/services/realtimeService";
import { ApiError } from "@/services/http";

type Status = "connecting" | "online" | "offline";

export function useConversation(matchId: string, initialMessages: ChatMessage[]) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [status, setStatus] = useState<Status>("connecting");
  const [sendError, setSendError] = useState<string | null>(null);

  useEffect(() => {
    const teardown = realtimeService.subscribePresence(matchId, {
      onSubscribed: () => setStatus("online"),
      onError: () => setStatus("offline"),
      onMessage: (msg) =>
        setMessages((prev) =>
          prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]
        ),
    });
    return teardown;
  }, [matchId]);

  const send = useCallback(
    async (body: string): Promise<boolean> => {
      setSendError(null);
      try {
        const { message } = await messageService.send(matchId, body);
        setMessages((prev) =>
          prev.some((m) => m.id === message.id) ? prev : [...prev, message]
        );
        return true;
      } catch (err) {
        const detail =
          err instanceof ApiError
            ? err.message || `HTTP ${err.status}`
            : "Network error.";
        setSendError(detail);
        return false;
      }
    },
    [matchId]
  );

  return { messages, status, send, sendError };
}
