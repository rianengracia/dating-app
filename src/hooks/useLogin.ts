"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/services/authService";
import { ApiError } from "@/services/http";

type State = {
  submitting: boolean;
  error: string | null;
};

export function useLogin() {
  const router = useRouter();
  const [state, setState] = useState<State>({ submitting: false, error: null });

  const submit = useCallback(
    async (email: string, password: string) => {
      setState({ submitting: true, error: null });
      try {
        const { redirect } = await authService.login(email, password);
        router.push(redirect);
        setState({ submitting: false, error: null });
      } catch (err) {
        const message =
          err instanceof ApiError && err.message
            ? err.message
            : "Network error. Try again.";
        setState({ submitting: false, error: message });
      }
    },
    [router]
  );

  return {
    submitting: state.submitting,
    error: state.error,
    submit,
  };
}
