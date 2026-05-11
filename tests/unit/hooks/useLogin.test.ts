import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";

vi.mock("@/services/authService", () => ({
  authService: {
    login: vi.fn(),
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: routerPush }),
}));

const routerPush = vi.fn();

import { authService } from "@/services/authService";
import { useLogin } from "@/hooks/useLogin";
import { ApiError } from "@/services/http";

beforeEach(() => {
  vi.mocked(authService.login).mockReset();
  routerPush.mockReset();
});

describe("useLogin", () => {
  it("starts idle with no error", () => {
    const { result } = renderHook(() => useLogin());
    expect(result.current.submitting).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("navigates to the returned redirect on success", async () => {
    vi.mocked(authService.login).mockResolvedValueOnce({ redirect: "/discover" });

    const { result } = renderHook(() => useLogin());
    await act(async () => {
      await result.current.submit("a@b.test", "password123");
    });

    expect(authService.login).toHaveBeenCalledWith("a@b.test", "password123");
    expect(routerPush).toHaveBeenCalledWith("/discover");
    expect(result.current.error).toBeNull();
    expect(result.current.submitting).toBe(false);
  });

  it("sets a user-facing error on 401 and does not navigate", async () => {
    vi.mocked(authService.login).mockRejectedValueOnce(
      new ApiError({ status: 401, message: "Invalid credentials." })
    );

    const { result } = renderHook(() => useLogin());
    await act(async () => {
      await result.current.submit("a@b.test", "wrong");
    });

    expect(routerPush).not.toHaveBeenCalled();
    expect(result.current.error).toBe("Invalid credentials.");
    expect(result.current.submitting).toBe(false);
  });

  it("falls back to a generic network message when ApiError has no message", async () => {
    vi.mocked(authService.login).mockRejectedValueOnce(
      new ApiError({ status: 0, message: "" })
    );

    const { result } = renderHook(() => useLogin());
    await act(async () => {
      await result.current.submit("a@b.test", "x");
    });

    expect(result.current.error).toMatch(/network|try again/i);
  });

  it("flips submitting=true while the request is in flight", async () => {
    let release!: () => void;
    vi.mocked(authService.login).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          release = () => resolve({ redirect: "/discover" });
        })
    );

    const { result } = renderHook(() => useLogin());
    act(() => {
      void result.current.submit("a@b.test", "x");
    });
    await waitFor(() => expect(result.current.submitting).toBe(true));

    release();
    await waitFor(() => expect(result.current.submitting).toBe(false));
  });
});
