import { describe, it, expect } from "vitest";
import { profileService } from "@/services/profileService";
import { server } from "../../mocks/server";
import { http, HttpResponse } from "msw";

describe("profileService.update", () => {
  it("PATCHes /api/profile with the patch body", async () => {
    let received: unknown = null;
    server.use(
      http.patch("/api/profile", async ({ request }) => {
        received = await request.json();
        return HttpResponse.json({ ok: true, displayName: "New", bio: "yo" });
      })
    );

    const result = await profileService.update({ displayName: "New", bio: "yo" });
    expect(received).toEqual({ displayName: "New", bio: "yo" });
    expect(result.displayName).toBe("New");
  });
});

describe("profileService.changePhoto", () => {
  it("POSTs multipart and returns the new photoUrl", async () => {
    let contentType = "";
    server.use(
      http.post("/api/profile/photo", async ({ request }) => {
        contentType = request.headers.get("content-type") ?? "";
        return HttpResponse.json({ ok: true, photoUrl: "https://blob/p.jpg" });
      })
    );

    const file = new File(["x"], "p.jpg", { type: "image/jpeg" });
    const result = await profileService.changePhoto(file);
    expect(contentType).toMatch(/multipart\/form-data/);
    expect(result.photoUrl).toBe("https://blob/p.jpg");
  });
});
