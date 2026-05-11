"use client";

import { useEffect, useRef, useState } from "react";
import Pusher, { type Channel } from "pusher-js";

type Message = {
  id: string;
  senderId: string;
  body: string;
  createdAt: string;
};

type Props = {
  matchId: string;
  meId: string;
  partner: { id: string; displayName: string; photoUrl: string };
  initialMessages: Message[];
};

export function Conversation({ matchId, meId, partner, initialMessages }: Props) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [status, setStatus] = useState<"connecting" | "online" | "offline">("connecting");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const channelRef = useRef<Channel | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
    if (!key || !cluster) {
      setStatus("offline");
      return;
    }

    const pusher = new Pusher(key, {
      cluster,
      authEndpoint: "/api/pusher/auth",
    });
    const channel = pusher.subscribe(`presence-match-${matchId}`);
    channelRef.current = channel;

    channel.bind("pusher:subscription_succeeded", () => setStatus("online"));
    channel.bind("pusher:subscription_error", () => setStatus("offline"));
    pusher.connection.bind("disconnected", () => setStatus("offline"));
    channel.bind("message:new", (msg: Message) => {
      setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
    });

    return () => {
      pusher.unsubscribe(`presence-match-${matchId}`);
      pusher.disconnect();
      channelRef.current = null;
    };
  }, [matchId]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  async function send(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const body = draft.trim();
    if (!body || sending) return;
    setDraft("");
    setSending(true);
    setSendError(null);
    try {
      const res = await fetch(`/api/matches/${matchId}/messages`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ body }),
      });
      const text = await res.text();
      let data: { ok?: boolean; error?: string; message?: Message } = {};
      try {
        data = JSON.parse(text);
      } catch {
        setDraft(body);
        setSendError(`HTTP ${res.status} — route not found or server error. Restart dev server.`);
        return;
      }
      if (!res.ok || !data.ok) {
        setDraft(body);
        setSendError(`HTTP ${res.status}: ${data.error ?? "unknown"}`);
        return;
      }
      if (data.message) {
        setMessages((prev) =>
          prev.some((m) => m.id === data.message!.id) ? prev : [...prev, data.message!]
        );
      }
    } catch (err) {
      setDraft(body);
      setSendError(`Network error: ${err instanceof Error ? err.message : "unknown"}`);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-surface border border-line tm-clip-br relative">
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-accent to-transparent" />

      <div className="flex items-center justify-between px-4 py-2 border-b border-line">
        <span className="tm-mono text-[10px] text-fg-dim">CONVERSATION // {matchId.slice(0, 8).toUpperCase()}</span>
        <span
          className={`tm-mono text-[10px] flex items-center gap-1 ${
            status === "online" ? "text-success" : status === "offline" ? "text-accent" : "text-fg-muted"
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              status === "online" ? "bg-success animate-pulse" : status === "offline" ? "bg-accent" : "bg-fg-muted"
            }`}
          />
          {status === "online" ? "LINKED" : status === "offline" ? "OFFLINE" : "CONNECTING"}
        </span>
      </div>

      <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center text-fg-muted text-sm py-12">
            No messages yet. Open the round.
          </div>
        )}
        {messages.map((m) => {
          const mine = m.senderId === meId;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[75%] px-4 py-2 tm-clip-br ${
                  mine
                    ? "bg-accent text-[#0F1923]"
                    : "bg-surface-2 border border-line text-fg"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap break-words">{m.body}</p>
                <div className={`tm-mono text-[9px] mt-1 ${mine ? "text-[#0F1923]/60" : "text-fg-dim"}`}>
                  {formatTime(m.createdAt)}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {sendError && (
        <div className="border-t border-accent bg-accent/10 px-4 py-2 tm-mono text-[11px] text-accent">
          ▸ {sendError}
        </div>
      )}

      <form
        onSubmit={send}
        className="border-t border-line p-3 flex items-center gap-2"
      >
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.currentTarget.value)}
          placeholder={`Message ${partner.displayName}...`}
          maxLength={2000}
          className="flex-1 bg-surface-2 border border-line text-fg placeholder:text-fg-dim h-11 px-3 tm-clip-tl focus:outline-none focus:ring-2 focus:ring-cyan focus:ring-offset-2 focus:ring-offset-bg"
        />
        <button
          type="submit"
          disabled={!draft.trim() || sending || status !== "online"}
          className="bg-accent text-[#0F1923] tm-mono text-xs px-5 h-11 tm-clip-tl hover:bg-accent-hover disabled:opacity-40 disabled:pointer-events-none"
        >
          SEND ▸
        </button>
      </form>
    </div>
  );
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
