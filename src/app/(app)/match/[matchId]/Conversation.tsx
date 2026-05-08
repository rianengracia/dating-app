"use client";

import { useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";

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
  const socketRef = useRef<Socket | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const socket = io({ path: "/socket.io", transports: ["websocket", "polling"] });
    socketRef.current = socket;

    socket.on("connect", () => {
      setStatus("online");
      socket.emit("match:join", matchId, (resp: { ok: boolean; error?: string }) => {
        if (!resp?.ok) setStatus("offline");
      });
    });
    socket.on("connect_error", () => setStatus("offline"));
    socket.on("disconnect", () => setStatus("offline"));
    socket.on("message:new", (msg: Message) => {
      setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
    });

    return () => {
      socket.emit("match:leave", matchId);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [matchId]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  function send(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const body = draft.trim();
    if (!body || !socketRef.current) return;
    setDraft("");
    socketRef.current.emit(
      "message:send",
      { matchId, body },
      (resp: { ok: boolean; message?: Message; error?: string }) => {
        if (!resp?.ok) {
          // restore draft so the user can retry
          setDraft(body);
        }
      }
    );
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
          disabled={!draft.trim() || status !== "online"}
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
