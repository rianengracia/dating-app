import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, renderHook } from "@testing-library/react";

const mocks = vi.hoisted(() => ({
  update: vi.fn(),
  changePhoto: vi.fn(),
}));

vi.mock("@/services/profileService", () => ({
  profileService: { update: mocks.update, changePhoto: mocks.changePhoto },
}));

import { useProfile } from "@/hooks/useProfile";
import { ApiError } from "@/services/http";

beforeEach(() => {
  mocks.update.mockReset();
  mocks.changePhoto.mockReset();
});

describe("useProfile.update", () => {
  it("sets an OK message after a successful save", async () => {
    mocks.update.mockResolvedValueOnce({ displayName: "New", bio: "" });

    const { result } = renderHook(() => useProfile());
    await act(async () => {
      await result.current.update({ displayName: "New" });
    });

    expect(result.current.message).toMatchObject({ kind: "ok" });
  });

  it("surfaces the server error message on failure", async () => {
    mocks.update.mockRejectedValueOnce(new ApiError({ status: 400, message: "bio too long" }));

    const { result } = renderHook(() => useProfile());
    await act(async () => {
      await result.current.update({ bio: "x".repeat(300) });
    });

    expect(result.current.message).toMatchObject({ kind: "err", text: "bio too long" });
  });
});

describe("useProfile.changePhoto", () => {
  it("returns the new photoUrl on success", async () => {
    mocks.changePhoto.mockResolvedValueOnce({ photoUrl: "https://blob/p.jpg" });

    const { result } = renderHook(() => useProfile());
    let url: string | null = "";
    await act(async () => {
      url = await result.current.changePhoto(new File(["x"], "p.jpg", { type: "image/jpeg" }));
    });

    expect(url).toBe("https://blob/p.jpg");
    expect(result.current.message).toMatchObject({ kind: "ok" });
  });

  it("returns null and sets an error message on failure", async () => {
    mocks.changePhoto.mockRejectedValueOnce(
      new ApiError({ status: 400, message: "file too big" })
    );

    const { result } = renderHook(() => useProfile());
    let url: string | null = "x";
    await act(async () => {
      url = await result.current.changePhoto(new File(["x"], "p.jpg", { type: "image/jpeg" }));
    });

    expect(url).toBeNull();
    expect(result.current.message).toMatchObject({ kind: "err", text: "file too big" });
  });
});
