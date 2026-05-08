"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";

type ApiResponse =
  | { ok: true; redirect: string }
  | { ok: false; error?: string; errors?: Record<string, string> };

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data: ApiResponse = await res.json();
      if (!res.ok || !data.ok) {
        setError((!data.ok && data.error) || "Credentials rejected.");
        setSubmitting(false);
        return;
      }
      router.push(data.redirect);
    } catch {
      setError("Network error. Try again.");
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="bg-surface border border-line tm-clip-br p-6 md:p-10 space-y-6 relative max-w-md"
    >
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-accent to-transparent" />

      {error && (
        <div className="border border-accent bg-accent/10 px-4 py-3 tm-mono text-xs text-accent tm-clip-tl">
          ▸ {error}
        </div>
      )}

      <Field label="EMAIL" htmlFor="email">
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.currentTarget.value)}
          placeholder="agent@truematch.gg"
        />
      </Field>

      <Field label="PASSWORD" htmlFor="password">
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.currentTarget.value)}
        />
      </Field>

      <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-2">
        <Button type="submit" variant="primary" size="lg" disabled={submitting}>
          {submitting ? "AUTHENTICATING..." : "SIGN IN"}
        </Button>
        <p className="tm-mono text-[10px] text-fg-dim">
          NEW HERE?{" "}
          <Link
            href="/register"
            className="text-cyan hover:text-fg underline-offset-2 hover:underline"
          >
            CREATE PROFILE
          </Link>
        </p>
      </div>
    </form>
  );
}
