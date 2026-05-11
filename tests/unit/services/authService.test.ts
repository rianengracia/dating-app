import { describe, it, expect } from "vitest";
import { authService } from "@/services/authService";
import { ApiError } from "@/services/http";
import { server } from "../../mocks/server";
import { http, HttpResponse } from "msw";

describe("authService.login", () => {
  it("POSTs JSON credentials and returns the redirect path", async () => {
    let received: unknown = null;
    server.use(
      http.post("/api/auth/login", async ({ request }) => {
        received = await request.json();
        return HttpResponse.json({ ok: true, redirect: "/discover" });
      })
    );

    const result = await authService.login("agent@truematch.test", "password123");

    expect(received).toEqual({ email: "agent@truematch.test", password: "password123" });
    expect(result).toEqual({ redirect: "/discover" });
  });

  it("throws ApiError with the server message on 401", async () => {
    server.use(
      http.post("/api/auth/login", () =>
        HttpResponse.json({ ok: false, error: "Invalid credentials." }, { status: 401 })
      )
    );

    await expect(authService.login("a@b.test", "wrong")).rejects.toMatchObject({
      name: "ApiError",
      status: 401,
      message: "Invalid credentials.",
    });
  });
});

describe("authService.logout", () => {
  it("POSTs to /api/auth/logout", async () => {
    let hit = false;
    server.use(
      http.post("/api/auth/logout", () => {
        hit = true;
        return HttpResponse.json({ ok: true });
      })
    );

    await authService.logout();
    expect(hit).toBe(true);
  });
});

describe("authService.register", () => {
  it("POSTs multipart form data and returns the redirect path", async () => {
    let contentType = "";
    server.use(
      http.post("/api/auth/register", async ({ request }) => {
        contentType = request.headers.get("content-type") ?? "";
        return HttpResponse.json({ ok: true, redirect: "/discover" });
      })
    );

    const fd = new FormData();
    fd.set("email", "new@truematch.test");
    fd.set("password", "password123");
    fd.set("displayName", "Newbie");
    fd.set("age", "25");
    fd.set("bio", "hello");
    fd.set("photo", new File(["x"], "p.jpg", { type: "image/jpeg" }));

    const result = await authService.register(fd);
    expect(contentType).toMatch(/multipart\/form-data/);
    expect(result).toEqual({ redirect: "/discover" });
  });

  it("maps server-side field errors onto ApiError.fieldErrors", async () => {
    server.use(
      http.post("/api/auth/register", () =>
        HttpResponse.json(
          { ok: false, errors: { email: "An account with this email already exists." } },
          { status: 409 }
        )
      )
    );

    try {
      await authService.register(new FormData());
      expect.fail("expected throw");
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      expect((err as ApiError).status).toBe(409);
      expect((err as ApiError).fieldErrors).toEqual({
        email: "An account with this email already exists.",
      });
    }
  });
});
