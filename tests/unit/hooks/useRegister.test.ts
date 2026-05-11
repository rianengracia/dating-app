import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, renderHook } from "@testing-library/react";

vi.mock("@/services/authService", () => ({
  authService: {
    register: vi.fn(),
  },
}));

const routerPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: routerPush }),
}));

import { authService } from "@/services/authService";
import { useRegister } from "@/hooks/useRegister";
import { ApiError } from "@/services/http";

beforeEach(() => {
  vi.mocked(authService.register).mockReset();
  routerPush.mockReset();
});

function makeFormData() {
  const fd = new FormData();
  fd.set("email", "new@truematch.test");
  fd.set("password", "password123");
  fd.set("displayName", "Newbie");
  fd.set("age", "25");
  fd.set("bio", "hello");
  fd.set("photo", new File(["x"], "p.jpg", { type: "image/jpeg" }));
  return fd;
}

describe("useRegister", () => {
  it("starts idle with no errors", () => {
    const { result } = renderHook(() => useRegister());
    expect(result.current.submitting).toBe(false);
    expect(result.current.errors).toEqual({});
  });

  it("navigates to the redirect path on success", async () => {
    vi.mocked(authService.register).mockResolvedValueOnce({ redirect: "/discover" });

    const { result } = renderHook(() => useRegister());
    await act(async () => {
      await result.current.submit(makeFormData());
    });

    expect(routerPush).toHaveBeenCalledWith("/discover");
    expect(result.current.errors).toEqual({});
  });

  it("maps server-side fieldErrors onto state when registration fails", async () => {
    vi.mocked(authService.register).mockRejectedValueOnce(
      new ApiError({
        status: 409,
        message: "Conflict.",
        fieldErrors: { email: "An account with this email already exists." },
      })
    );

    const { result } = renderHook(() => useRegister());
    await act(async () => {
      await result.current.submit(makeFormData());
    });

    expect(routerPush).not.toHaveBeenCalled();
    expect(result.current.errors).toEqual({
      email: "An account with this email already exists.",
    });
  });

  it("falls back to a form-level error when no fieldErrors are provided", async () => {
    vi.mocked(authService.register).mockRejectedValueOnce(
      new ApiError({ status: 500, message: "Server error." })
    );

    const { result } = renderHook(() => useRegister());
    await act(async () => {
      await result.current.submit(makeFormData());
    });

    expect(result.current.errors.form).toBe("Server error.");
  });

  it("clears prior errors on a new submit attempt", async () => {
    vi.mocked(authService.register)
      .mockRejectedValueOnce(
        new ApiError({
          status: 400,
          message: "bad",
          fieldErrors: { email: "Required." },
        })
      )
      .mockResolvedValueOnce({ redirect: "/discover" });

    const { result } = renderHook(() => useRegister());

    await act(async () => {
      await result.current.submit(makeFormData());
    });
    expect(result.current.errors).toEqual({ email: "Required." });

    await act(async () => {
      await result.current.submit(makeFormData());
    });
    expect(result.current.errors).toEqual({});
    expect(routerPush).toHaveBeenCalledWith("/discover");
  });
});
