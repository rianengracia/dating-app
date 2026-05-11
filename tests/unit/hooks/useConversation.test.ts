import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";

const mocks = vi.hoisted(() => ({
  messageSend: vi.fn(),
  subscribePresence: vi.fn(),
}));

vi.mock("@/services/messageService", () => ({
  messageService: {
    send: mocks.messageSend,
    list: vi.fn(),
  },
}));

vi.mock("@/services/realtimeService", () => ({
  realtimeService: {
    subscribePresence: mocks.subscribePresence,
  },
}));

import { useConversation } from "@/hooks/useConversation";
import { ApiError } from "@/services/http";
import { makeMessage } from "../../fixtures/message";

type Handlers = {
  onSubscribed: () => void;
  onError: (reason?: unknown) => void;
  onMessage: (msg: { id: string; senderId: string; body: string; createdAt: string }) => void;
};

let lastHandlers: Handlers | null = null;
let teardownSpy: ReturnType<typeof vi.fn>;

beforeEach(() => {
  mocks.messageSend.mockReset();
  mocks.subscribePresence.mockReset();
  teardownSpy = vi.fn();
  lastHandlers = null;
  mocks.subscribePresence.mockImplementation((_matchId, handlers) => {
    lastHandlers = handlers;
    return teardownSpy;
  });
});

describe("useConversation", () => {
  it("starts in 'connecting' and flips to 'online' once subscribed", async () => {
    const { result } = renderHook(() => useConversation("m-1", []));
    expect(result.current.status).toBe("connecting");

    act(() => {
      lastHandlers!.onSubscribed();
    });

    await waitFor(() => expect(result.current.status).toBe("online"));
  });

  it("flips to 'offline' on subscription error", async () => {
    const { result } = renderHook(() => useConversation("m-1", []));

    act(() => {
      lastHandlers!.onError(new Error("nope"));
    });

    await waitFor(() => expect(result.current.status).toBe("offline"));
  });

  it("appends incoming realtime messages and deduplicates by id", async () => {
    const { result } = renderHook(() => useConversation("m-1", []));
    const incoming = makeMessage({ id: "m-incoming", body: "hi" });

    act(() => {
      lastHandlers!.onMessage(incoming);
      lastHandlers!.onMessage(incoming);
    });

    await waitFor(() => expect(result.current.messages).toHaveLength(1));
    expect(result.current.messages[0].id).toBe("m-incoming");
  });

  it("seeds with initialMessages", () => {
    const seeded = [makeMessage({ id: "a" }), makeMessage({ id: "b" })];
    const { result } = renderHook(() => useConversation("m-1", seeded));
    expect(result.current.messages.map((m) => m.id)).toEqual(["a", "b"]);
  });

  it("send appends the persisted message and clears sendError", async () => {
    const persisted = makeMessage({ id: "sent-1", body: "yo" });
    mocks.messageSend.mockResolvedValueOnce({ message: persisted });

    const { result } = renderHook(() => useConversation("m-1", []));
    await act(async () => {
      await result.current.send("yo");
    });

    expect(mocks.messageSend).toHaveBeenCalledWith("m-1", "yo");
    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0].id).toBe("sent-1");
    expect(result.current.sendError).toBeNull();
  });

  it("send populates sendError and does not append on a 403", async () => {
    mocks.messageSend.mockRejectedValueOnce(
      new ApiError({ status: 403, message: "forbidden" })
    );
    const { result } = renderHook(() => useConversation("m-1", []));
    await act(async () => {
      await result.current.send("nope");
    });

    expect(result.current.messages).toHaveLength(0);
    expect(result.current.sendError).toMatch(/forbidden|403/i);
  });

  it("unsubscribes on unmount", () => {
    const { unmount } = renderHook(() => useConversation("m-1", []));
    unmount();
    expect(teardownSpy).toHaveBeenCalled();
  });
});
