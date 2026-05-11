import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const routerPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: routerPush }),
}));

import { server } from "../../mocks/server";
import { http, HttpResponse } from "msw";
import { RegisterForm } from "@/app/(auth)/register/RegisterForm";

beforeEach(() => {
  routerPush.mockReset();
});

async function fillRequiredFields(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/email/i), "new@truematch.test");
  await user.type(screen.getByLabelText(/password/i), "password123");
  await user.type(screen.getByLabelText(/display name/i), "Newbie");
  await user.type(screen.getByLabelText(/age/i), "27");
  await user.type(screen.getByLabelText(/bio/i), "Looking for a duo.");
  const photoInput = document.getElementById("photo") as HTMLInputElement;
  await user.upload(photoInput, new File(["x"], "p.jpg", { type: "image/jpeg" }));
}

function submitForm() {
  const form = document.querySelector("form");
  if (!form) throw new Error("form not in DOM");
  fireEvent.submit(form);
}

describe("<RegisterForm />", () => {
  it("navigates to /discover after a successful registration", async () => {
    server.use(
      http.post("/api/auth/register", () =>
        HttpResponse.json({ ok: true, redirect: "/discover" })
      )
    );

    const user = userEvent.setup();
    render(<RegisterForm />);
    await fillRequiredFields(user);
    submitForm();

    await vi.waitFor(() => {
      expect(routerPush).toHaveBeenCalledWith("/discover");
    });
  });

  it("shows an inline field error when the server says the email is taken", async () => {
    server.use(
      http.post("/api/auth/register", () =>
        HttpResponse.json(
          { ok: false, errors: { email: "An account with this email already exists." } },
          { status: 409 }
        )
      )
    );

    const user = userEvent.setup();
    render(<RegisterForm />);
    await fillRequiredFields(user);
    submitForm();

    expect(
      await screen.findByText(/an account with this email already exists/i)
    ).toBeInTheDocument();
    expect(routerPush).not.toHaveBeenCalled();
  });

  it("surfaces a form-level error when the server returns a non-field failure", async () => {
    server.use(
      http.post("/api/auth/register", () =>
        HttpResponse.json({ ok: false, error: "Photo upload failed." }, { status: 500 })
      )
    );

    const user = userEvent.setup();
    render(<RegisterForm />);
    await fillRequiredFields(user);
    submitForm();

    expect(await screen.findByText(/photo upload failed/i)).toBeInTheDocument();
  });
});
