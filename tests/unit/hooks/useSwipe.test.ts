import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";

const mocks = vi.hoisted(() => ({
  swipe: vi.fn(),
}));

vi.mock("@/services/swipeService", () => ({
  swipeService: { swipe: mocks.swipe },
}));

import { useSwipe } from "@/hooks/useSwipe";

beforeEach(() => {
  mocks.swipe.mockReset();
});

describe("useSwipe", () => {
  it("starts with pending=false and no lastMatch", () => {
    const { result } = renderHook(() => useSwipe());
    expect(result.current.pending).toBe(false);
    expect(result.current.lastMatch).toBeNull();
  });

  it("like calls swipeService with LIKE and sets lastMatch when mutual", async () => {
    mocks.swipe.mockResolvedValueOnce({
      matched: true,
      matchId: "m-1",
      partner: { id: "u-target", displayName: "Sage", photoUrl: "/p.jpg" },
    });

    const { result } = renderHook(() => useSwipe());
    await act(async () => {
      await result.current.like("u-target");
    });

    expect(mocks.swipe).toHaveBeenCalledWith("u-target", "LIKE");
    expect(result.current.lastMatch).toMatchObject({ matchId: "m-1" });
  });

  it("skip calls swipeService with SKIP and does NOT set lastMatch", async () => {
    mocks.swipe.mockResolvedValueOnce({ matched: false });

    const { result } = renderHook(() => useSwipe());
    await act(async () => {
      await result.current.skip("u-target");
    });

    expect(mocks.swipe).toHaveBeenCalledWith("u-target", "SKIP");
    expect(result.current.lastMatch).toBeNull();
  });

  it("clearMatch resets lastMatch", async () => {
    mocks.swipe.mockResolvedValueOnce({
      matched: true,
      matchId: "m-1",
      partner: { id: "u", displayName: "Sage", photoUrl: "/p.jpg" },
    });

    const { result } = renderHook(() => useSwipe());
    await act(async () => {
      await result.current.like("u");
    });
    expect(result.current.lastMatch).not.toBeNull();

    act(() => result.current.clearMatch());
    expect(result.current.lastMatch).toBeNull();
  });

  it("flips pending=true while the request is in flight", async () => {
    let release!: () => void;
    mocks.swipe.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          release = () => resolve({ matched: false });
        })
    );

    const { result } = renderHook(() => useSwipe());
    act(() => {
      void result.current.like("u");
    });
    await waitFor(() => expect(result.current.pending).toBe(true));
    release();
    await waitFor(() => expect(result.current.pending).toBe(false));
  });
});
