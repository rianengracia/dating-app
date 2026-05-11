import { describe, it, expect } from "vitest";
import { matchService } from "@/services/matchService";
import { server } from "../../mocks/server";
import { http, HttpResponse } from "msw";

describe("matchService.list", () => {
  it("GETs /api/matches and unwraps matches[]", async () => {
    server.use(
      http.get("/api/matches", () =>
        HttpResponse.json({
          ok: true,
          matches: [
            {
              matchId: "m-1",
              partner: {
                id: "u",
                displayName: "Sage",
                photoUrl: "/p.jpg",
                age: 25,
                bio: "",
              },
              lastMessage: null,
              createdAt: "2026-01-01T00:00:00.000Z",
            },
          ],
        })
      )
    );

    const result = await matchService.list();
    expect(result.matches).toHaveLength(1);
    expect(result.matches[0].matchId).toBe("m-1");
  });
});

describe("matchService.unmatch", () => {
  it("DELETEs /api/matches/:id", async () => {
    let hitWith = "";
    server.use(
      http.delete("/api/matches/:id", ({ params }) => {
        hitWith = String(params.id);
        return HttpResponse.json({ ok: true });
      })
    );

    await matchService.unmatch("m-9");
    expect(hitWith).toBe("m-9");
  });
});
