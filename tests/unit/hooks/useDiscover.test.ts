import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";

const mocks = vi.hoisted(() => ({
  list: vi.fn(),
}));

vi.mock("@/services/discoverService", () => ({
  discoverService: { list: mocks.list },
}));

import { useDiscover } from "@/hooks/useDiscover";

beforeEach(() => {
  mocks.list.mockReset();
});

const C = (over = {}) => ({
  id: "u",
  displayName: "Sage",
  age: 25,
  bio: "",
  photoUrl: "",
  distanceKm: 5,
  ...over,
});

describe("useDiscover", () => {
  it("loads candidates with the default filters on mount", async () => {
    mocks.list.mockResolvedValueOnce({ candidates: [C({ id: "a" }), C({ id: "b" })] });

    const { result } = renderHook(() => useDiscover());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mocks.list).toHaveBeenCalledWith({ minAge: 18, maxAge: 99, maxKm: null });
    expect(result.current.candidates.map((c) => c.id)).toEqual(["a", "b"]);
  });

  it("re-fetches when filters change", async () => {
    mocks.list.mockResolvedValue({ candidates: [] });

    const { result } = renderHook(() => useDiscover());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.setFilters({ minAge: 25, maxAge: 40, maxKm: 50 });
    });

    await waitFor(() => {
      expect(mocks.list).toHaveBeenLastCalledWith({ minAge: 25, maxAge: 40, maxKm: 50 });
    });
  });

  it("removeTop pops the first candidate off the queue", async () => {
    mocks.list.mockResolvedValueOnce({ candidates: [C({ id: "a" }), C({ id: "b" })] });

    const { result } = renderHook(() => useDiscover());
    await waitFor(() => expect(result.current.candidates).toHaveLength(2));

    act(() => result.current.removeTop());
    expect(result.current.candidates.map((c) => c.id)).toEqual(["b"]);
  });

  it("captures the server error message on failure", async () => {
    mocks.list.mockRejectedValueOnce(new Error("oops"));

    const { result } = renderHook(() => useDiscover());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBeTruthy();
    expect(result.current.candidates).toEqual([]);
  });
});
