import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => {
  const channelBind = vi.fn();
  const channelUnbind = vi.fn();
  const pusherSubscribe = vi.fn(() => ({
    bind: channelBind,
    unbind_all: channelUnbind,
  }));
  const pusherUnsubscribe = vi.fn();
  const pusherDisconnect = vi.fn();
  const pusherCtor = vi.fn(function PusherStub(this: object) {
    Object.assign(this, {
      subscribe: pusherSubscribe,
      unsubscribe: pusherUnsubscribe,
      disconnect: pusherDisconnect,
      connection: { bind: vi.fn() },
    });
  });
  return {
    channelBind,
    channelUnbind,
    pusherSubscribe,
    pusherUnsubscribe,
    pusherDisconnect,
    pusherCtor,
  };
});

const {
  channelBind,
  pusherSubscribe,
  pusherUnsubscribe,
  pusherDisconnect,
  pusherCtor,
} = mocks;

vi.mock("pusher-js", () => ({
  default: mocks.pusherCtor,
}));

import { realtimeService } from "@/services/realtimeService";

beforeEach(() => {
  channelBind.mockClear();
  pusherSubscribe.mockClear();
  pusherUnsubscribe.mockClear();
  pusherDisconnect.mockClear();
  pusherCtor.mockClear();
  // env that the service reads
  process.env.NEXT_PUBLIC_PUSHER_KEY = "test-key";
  process.env.NEXT_PUBLIC_PUSHER_CLUSTER = "test-cluster";
});

describe("realtimeService.subscribePresence", () => {
  it("connects to the right cluster + key + auth endpoint and subscribes to the presence channel", () => {
    realtimeService.subscribePresence("match-1", {
      onSubscribed: () => {},
      onError: () => {},
      onMessage: () => {},
    });

    expect(pusherCtor).toHaveBeenCalledWith("test-key", {
      cluster: "test-cluster",
      authEndpoint: "/api/pusher/auth",
    });
    expect(pusherSubscribe).toHaveBeenCalledWith("presence-match-match-1");
  });

  it("wires the handlers onto the channel events", () => {
    const handlers = {
      onSubscribed: vi.fn(),
      onError: vi.fn(),
      onMessage: vi.fn(),
    };
    realtimeService.subscribePresence("match-1", handlers);

    const bindings = Object.fromEntries(channelBind.mock.calls);
    expect(bindings["pusher:subscription_succeeded"]).toBeTypeOf("function");
    expect(bindings["pusher:subscription_error"]).toBeTypeOf("function");
    expect(bindings["message:new"]).toBeTypeOf("function");

    bindings["pusher:subscription_succeeded"]();
    bindings["pusher:subscription_error"]();
    bindings["message:new"]({ id: "x" });

    expect(handlers.onSubscribed).toHaveBeenCalled();
    expect(handlers.onError).toHaveBeenCalled();
    expect(handlers.onMessage).toHaveBeenCalledWith({ id: "x" });
  });

  it("returns a teardown that unsubscribes and disconnects", () => {
    const teardown = realtimeService.subscribePresence("match-1", {
      onSubscribed: () => {},
      onError: () => {},
      onMessage: () => {},
    });
    teardown();
    expect(pusherUnsubscribe).toHaveBeenCalledWith("presence-match-match-1");
    expect(pusherDisconnect).toHaveBeenCalled();
  });

  it("returns a no-op teardown and reports an error when env is missing", () => {
    delete process.env.NEXT_PUBLIC_PUSHER_KEY;
    const onError = vi.fn();
    const teardown = realtimeService.subscribePresence("match-1", {
      onSubscribed: () => {},
      onError,
      onMessage: () => {},
    });

    expect(pusherCtor).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalled();
    expect(() => teardown()).not.toThrow();
  });
});
