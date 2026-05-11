import { describe, it, expect } from "vitest";
import { http, request, ApiError } from "@/services/http";
import { server } from "../../mocks/server";
import { HttpResponse, http as msw } from "msw";

describe("request()", () => {
  it("unwraps a success envelope into the data shape", async () => {
    server.use(
      msw.get("/api/things", () =>
        HttpResponse.json({ ok: true, things: ["a", "b"] })
      )
    );

    const data = await request<{ things: string[] }>({ url: "/api/things" });
    expect(data.things).toEqual(["a", "b"]);
  });

  it("throws ApiError on ok=false envelope", async () => {
    server.use(
      msw.post("/api/things", () =>
        HttpResponse.json({ ok: false, error: "nope" }, { status: 400 })
      )
    );

    await expect(request({ url: "/api/things", method: "POST" })).rejects.toMatchObject({
      name: "ApiError",
      status: 400,
      message: "nope",
    });
  });

  it("surfaces fieldErrors on validation failures", async () => {
    server.use(
      msw.post("/api/things", () =>
        HttpResponse.json(
          { ok: false, errors: { email: "Required" } },
          { status: 400 }
        )
      )
    );

    try {
      await request({ url: "/api/things", method: "POST" });
      expect.fail("expected throw");
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      expect((err as ApiError).fieldErrors).toEqual({ email: "Required" });
    }
  });

  it("uses the configured axios instance", () => {
    expect(http.defaults.withCredentials).toBe(true);
  });
});
