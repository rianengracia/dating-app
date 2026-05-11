import { http, HttpResponse } from "msw";

// Default handlers can be overridden per test with server.use(...).
// Keep this list minimal — prefer explicit per-test handlers for readability.
export const handlers = [
  http.get("/api/discover", () =>
    HttpResponse.json({ ok: true, candidates: [] }, { status: 200 })
  ),
];
