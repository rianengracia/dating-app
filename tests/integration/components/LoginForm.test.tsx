import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const routerPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: routerPush }),
}));

import { server } from "../../mocks/server";
import { http, HttpResponse } from "msw";
import { LoginForm } from "@/app/(auth)/login/LoginForm";

beforeEach(() => {
  routerPush.mockReset();
});

describe("<LoginForm />", () => {
  it("submits credentials and redirects to /discover on success", async () => {
    server.use(
      http.post("/api/auth/login", () =>
        HttpResponse.json({ ok: true, redirect: "/discover" })
      )
    );

    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText(/email/i), "agent@truematch.test");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await vi.waitFor(() => {
      expect(routerPush).toHaveBeenCalledWith("/discover");
    });
  });

  it("shows an inline error when the server rejects the credentials", async () => {
    server.use(
      http.post("/api/auth/login", () =>
        HttpResponse.json(
          { ok: false, error: "Invalid email or password." },
          { status: 401 }
        )
      )
    );

    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText(/email/i), "agent@truematch.test");
    await user.type(screen.getByLabelText(/password/i), "wrong");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(await screen.findByText(/invalid email or password/i)).toBeInTheDocument();
    expect(routerPush).not.toHaveBeenCalled();
  });

  it("disables the submit button while the request is in flight", async () => {
    let release!: () => void;
    server.use(
      http.post("/api/auth/login", async () => {
        await new Promise<void>((resolve) => {
          release = resolve;
        });
        return HttpResponse.json({ ok: true, redirect: "/discover" });
      })
    );

    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText(/email/i), "agent@truematch.test");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(await screen.findByRole("button", { name: /authenticating/i })).toBeDisabled();
    release();
  });
});
