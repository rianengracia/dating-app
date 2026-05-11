import { describe, it, expect } from "vitest";
import { discoverService } from "@/services/discoverService";
import { server } from "../../mocks/server";
import { http, HttpResponse } from "msw";

describe("discoverService.list", () => {
  it("sends minAge/maxAge/maxKm query params and unwraps candidates", async () => {
    let receivedUrl = "";
    server.use(
      http.get("/api/discover", ({ request }) => {
        receivedUrl = request.url;
        return HttpResponse.json({
          ok: true,
          candidates: [{ id: "u1", displayName: "Sage", age: 25, bio: "", photoUrl: "", distanceKm: 5 }],
        });
      })
    );

    const result = await discoverService.list({ minAge: 21, maxAge: 35, maxKm: 50 });
    expect(receivedUrl).toMatch(/minAge=21/);
    expect(receivedUrl).toMatch(/maxAge=35/);
    expect(receivedUrl).toMatch(/maxKm=50/);
    expect(result.candidates).toHaveLength(1);
  });

  it("omits maxKm when null", async () => {
    let receivedUrl = "";
    server.use(
      http.get("/api/discover", ({ request }) => {
        receivedUrl = request.url;
        return HttpResponse.json({ ok: true, candidates: [] });
      })
    );

    await discoverService.list({ minAge: 18, maxAge: 99, maxKm: null });
    expect(receivedUrl).not.toMatch(/maxKm/);
  });
});
