import { describe, it, expect } from "vitest";
import { messageService } from "@/services/messageService";
import { server } from "../../mocks/server";
import { http, HttpResponse } from "msw";

describe("messageService.list", () => {
  it("GETs /api/matches/:id/messages and unwraps the envelope", async () => {
    server.use(
      http.get("/api/matches/m-1/messages", () =>
        HttpResponse.json({
          ok: true,
          messages: [
            { id: "x", senderId: "u1", body: "hello", createdAt: "2026-01-01T00:00:00.000Z" },
          ],
          nextCursor: null,
        })
      )
    );

    const result = await messageService.list("m-1");
    expect(result.messages).toHaveLength(1);
    expect(result.nextCursor).toBeNull();
  });

  it("forwards the cursor as a query param", async () => {
    let receivedUrl = "";
    server.use(
      http.get("/api/matches/m-1/messages", ({ request }) => {
        receivedUrl = request.url;
        return HttpResponse.json({ ok: true, messages: [], nextCursor: null });
      })
    );

    await messageService.list("m-1", "cursor-abc");
    expect(receivedUrl).toContain("cursor=cursor-abc");
  });
});

describe("messageService.send", () => {
  it("POSTs the message body and returns the persisted message", async () => {
    let received: unknown = null;
    server.use(
      http.post("/api/matches/m-1/messages", async ({ request }) => {
        received = await request.json();
        return HttpResponse.json({
          ok: true,
          message: {
            id: "msg-1",
            matchId: "m-1",
            senderId: "u1",
            body: "yo",
            createdAt: "2026-01-01T00:00:00.000Z",
          },
        });
      })
    );

    const result = await messageService.send("m-1", "yo");
    expect(received).toEqual({ body: "yo" });
    expect(result.message.id).toBe("msg-1");
  });

  it("propagates a forbidden error as ApiError(403)", async () => {
    server.use(
      http.post("/api/matches/m-1/messages", () =>
        HttpResponse.json({ ok: false, error: "forbidden" }, { status: 403 })
      )
    );

    await expect(messageService.send("m-1", "yo")).rejects.toMatchObject({
      name: "ApiError",
      status: 403,
    });
  });
});
