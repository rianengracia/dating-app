"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/services/authService";
import { ApiError, type FieldErrors } from "@/services/http";

type RegisterErrors = FieldErrors & { form?: string };

export function useRegister() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<RegisterErrors>({});

  const submit = useCallback(
    async (form: FormData) => {
      setSubmitting(true);
      setErrors({});
      try {
        const { redirect } = await authService.register(form);
        router.push(redirect);
      } catch (err) {
        if (err instanceof ApiError && err.fieldErrors) {
          setErrors(err.fieldErrors);
        } else if (err instanceof ApiError) {
          setErrors({ form: err.message || "Server error." });
        } else {
          setErrors({ form: "Network error. Try again." });
        }
      } finally {
        setSubmitting(false);
      }
    },
    [router]
  );

  return { submit, submitting, errors };
}
