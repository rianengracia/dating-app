import { describe, it, expect } from "vitest";
import { swipeService } from "@/services/swipeService";
import { server } from "../../mocks/server";
import { http, HttpResponse } from "msw";

describe("swipeService.swipe", () => {
  it("POSTs targetId + action and returns the matched flag for a mutual like", async () => {
    let received: unknown = null;
    server.use(
      http.post("/api/swipe", async ({ request }) => {
        received = await request.json();
        return HttpResponse.json({
          ok: true,
          matched: true,
          matchId: "m-9",
          partner: { id: "u-target", displayName: "Sage", photoUrl: "/p.jpg" },
        });
      })
    );

    const result = await swipeService.swipe("u-target", "LIKE");
    expect(received).toEqual({ targetId: "u-target", action: "LIKE" });
    expect(result.matched).toBe(true);
    expect(result.matchId).toBe("m-9");
  });

  it("returns matched=false on a unilateral like", async () => {
    server.use(
      http.post("/api/swipe", () =>
        HttpResponse.json({ ok: true, matched: false })
      )
    );

    const result = await swipeService.swipe("u-other", "LIKE");
    expect(result.matched).toBe(false);
  });

  it("accepts SKIP action", async () => {
    let received: unknown = null;
    server.use(
      http.post("/api/swipe", async ({ request }) => {
        received = await request.json();
        return HttpResponse.json({ ok: true, matched: false });
      })
    );

    await swipeService.swipe("u-other", "SKIP");
    expect(received).toMatchObject({ action: "SKIP" });
  });
});
