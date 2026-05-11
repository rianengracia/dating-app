import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";

const mocks = vi.hoisted(() => ({
  list: vi.fn(),
  unmatch: vi.fn(),
}));

vi.mock("@/services/matchService", () => ({
  matchService: { list: mocks.list, unmatch: mocks.unmatch },
}));

import { useMatches } from "@/hooks/useMatches";

beforeEach(() => {
  mocks.list.mockReset();
  mocks.unmatch.mockReset();
});

const M = (id: string) => ({
  matchId: id,
  partner: { id: `p-${id}`, displayName: `P-${id}`, photoUrl: "/p.jpg", age: 25, bio: "" },
  lastMessage: null,
  createdAt: "2026-01-01T00:00:00.000Z",
});

describe("useMatches", () => {
  it("loads matches on mount", async () => {
    mocks.list.mockResolvedValueOnce({ matches: [M("a"), M("b")] });

    const { result } = renderHook(() => useMatches());
    await waitFor(() => expect(result.current.matches).toHaveLength(2));
    expect(result.current.loading).toBe(false);
  });

  it("unmatch removes the entry from the local list when the server confirms", async () => {
    mocks.list.mockResolvedValueOnce({ matches: [M("a"), M("b")] });
    mocks.unmatch.mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useMatches());
    await waitFor(() => expect(result.current.matches).toHaveLength(2));

    await act(async () => {
      await result.current.unmatch("a");
    });

    expect(mocks.unmatch).toHaveBeenCalledWith("a");
    expect(result.current.matches.map((m) => m.matchId)).toEqual(["b"]);
  });

  it("leaves the list untouched when unmatch fails", async () => {
    mocks.list.mockResolvedValueOnce({ matches: [M("a")] });
    mocks.unmatch.mockRejectedValueOnce(new Error("network"));

    const { result } = renderHook(() => useMatches());
    await waitFor(() => expect(result.current.matches).toHaveLength(1));

    await act(async () => {
      await result.current.unmatch("a");
    });

    expect(result.current.matches).toHaveLength(1);
  });
});
