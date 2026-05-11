import { request } from "./http";

export const authService = {
  login(email: string, password: string): Promise<{ redirect: string }> {
    return request<{ redirect: string }>({
      url: "/api/auth/login",
      method: "POST",
      data: { email, password },
    });
  },

  logout(): Promise<void> {
    return request<void>({ url: "/api/auth/logout", method: "POST" });
  },

  register(form: FormData): Promise<{ redirect: string }> {
    return request<{ redirect: string }>({
      url: "/api/auth/register",
      method: "POST",
      data: form,
      // Let the browser/axios set the multipart boundary automatically.
    });
  },
};
