"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Field";

type FieldErrors = Partial<Record<
  "email" | "password" | "displayName" | "age" | "bio" | "photo" | "form",
  string
>>;

type ApiResponse =
  | { ok: true; redirect: string }
  | { ok: false; errors?: FieldErrors; error?: string };

export function RegisterForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [photoName, setPhotoName] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!formRef.current) return;
    setSubmitting(true);
    setErrors({});

    const fd = new FormData(formRef.current);
    try {
      const res = await fetch("/api/auth/register", { method: "POST", body: fd });
      const data: ApiResponse = await res.json();
      if (!res.ok || !data.ok) {
        const fieldErrors: FieldErrors = (!data.ok && data.errors) || {};
        const formError = !data.ok ? data.error : undefined;
        setErrors({ ...fieldErrors, ...(formError ? { form: formError } : {}) });
        setSubmitting(false);
        return;
      }
      router.push(data.redirect);
    } catch {
      setErrors({ form: "Network error. Try again." });
      setSubmitting(false);
    }
  }

  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      className="bg-surface border border-line tm-clip-br p-6 md:p-10 space-y-6 relative"
    >
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-accent to-transparent" />

      {errors.form && (
        <div className="border border-accent bg-accent/10 px-4 py-3 tm-mono text-xs text-accent tm-clip-tl">
          ▸ {errors.form}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-5">
        <Field label="EMAIL" htmlFor="email" error={errors.email}>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            invalid={!!errors.email}
            placeholder="agent@truematch.gg"
          />
        </Field>

        <Field
          label="PASSWORD"
          htmlFor="password"
          hint="8+ chars, must include letter and digit"
          error={errors.password}
        >
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            invalid={!!errors.password}
          />
        </Field>

        <Field label="DISPLAY NAME" htmlFor="displayName" error={errors.displayName}>
          <Input
            id="displayName"
            name="displayName"
            type="text"
            autoComplete="nickname"
            required
            minLength={2}
            maxLength={32}
            invalid={!!errors.displayName}
            placeholder="Jett"
          />
        </Field>

        <Field label="AGE" htmlFor="age" hint="Must be 18+" error={errors.age}>
          <Input
            id="age"
            name="age"
            type="number"
            inputMode="numeric"
            min={18}
            max={99}
            required
            invalid={!!errors.age}
            placeholder="27"
          />
        </Field>
      </div>

      <Field label="BIO" htmlFor="bio" hint="Up to 280 characters" error={errors.bio}>
        <Textarea
          id="bio"
          name="bio"
          required
          maxLength={280}
          invalid={!!errors.bio}
          placeholder="Looking for a partner who pushes site without checking the minimap..."
        />
      </Field>

      <Field
        label="PROFILE PHOTO"
        htmlFor="photo"
        hint="JPEG, PNG, or WebP — up to 5 MB"
        error={errors.photo}
      >
        <div className="flex items-center gap-3">
          <label
            htmlFor="photo"
            className="tm-mono text-xs text-fg border border-line hover:border-accent px-4 h-11 inline-flex items-center tm-clip-tl cursor-pointer transition-colors"
          >
            ▸ SELECT FILE
          </label>
          <span className="tm-mono text-xs text-fg-muted truncate">
            {photoName ?? "NO FILE SELECTED"}
          </span>
          <input
            id="photo"
            name="photo"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            required
            className="sr-only"
            onChange={(e) => setPhotoName(e.currentTarget.files?.[0]?.name ?? null)}
          />
        </div>
      </Field>

      <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-2">
        <Button type="submit" variant="primary" size="lg" disabled={submitting}>
          {submitting ? "DEPLOYING..." : "DEPLOY PROFILE"}
        </Button>
        <p className="tm-mono text-[10px] text-fg-dim">
          ALREADY ENLISTED?{" "}
          <Link href="/login" className="text-cyan hover:text-fg underline-offset-2 hover:underline">
            SIGN IN
          </Link>
        </p>
      </div>
    </form>
  );
}
