import { describe, it, expect } from "vitest";
import { pushService } from "@/services/pushService";
import { server } from "../../mocks/server";
import { http, HttpResponse } from "msw";

describe("pushService.getPublicKey", () => {
  it("GETs the VAPID key endpoint", async () => {
    server.use(
      http.get("/api/push/vapid-key", () =>
        HttpResponse.json({ ok: true, publicKey: "B-VAPID-KEY" })
      )
    );
    const result = await pushService.getPublicKey();
    expect(result.publicKey).toBe("B-VAPID-KEY");
  });

  it("returns ApiError(503) when push is unconfigured server-side", async () => {
    server.use(
      http.get("/api/push/vapid-key", () =>
        HttpResponse.json({ ok: false, error: "Push not configured." }, { status: 503 })
      )
    );
    await expect(pushService.getPublicKey()).rejects.toMatchObject({
      name: "ApiError",
      status: 503,
    });
  });
});

describe("pushService.subscribe", () => {
  it("POSTs the subscription JSON", async () => {
    let received: unknown = null;
    server.use(
      http.post("/api/push/subscribe", async ({ request }) => {
        received = await request.json();
        return HttpResponse.json({ ok: true });
      })
    );
    await pushService.subscribe({ endpoint: "https://fcm/...", keys: { p256dh: "x", auth: "y" } });
    expect(received).toMatchObject({ endpoint: "https://fcm/..." });
  });
});
