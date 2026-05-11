import axios, { type AxiosError, type AxiosRequestConfig } from "axios";

export type FieldErrors = Record<string, string>;

export class ApiError extends Error {
  status: number;
  code?: string;
  fieldErrors?: FieldErrors;

  constructor(opts: { message: string; status: number; code?: string; fieldErrors?: FieldErrors }) {
    super(opts.message);
    this.name = "ApiError";
    this.status = opts.status;
    this.code = opts.code;
    this.fieldErrors = opts.fieldErrors;
  }
}

export const http = axios.create({
  baseURL: typeof window === "undefined" ? process.env.NEXT_PUBLIC_APP_URL || "" : "",
  withCredentials: true,
  headers: { "Accept": "application/json" },
});

type Envelope<T> =
  | { ok: true } & T
  | { ok: false; error?: string; errors?: FieldErrors };

/**
 * Issue an HTTP request and unwrap the project's `{ ok, ... }` envelope.
 * Throws ApiError for non-2xx or `ok: false` responses.
 */
export async function request<T = unknown>(config: AxiosRequestConfig): Promise<T> {
  try {
    const res = await http.request<Envelope<T>>(config);
    if (res.data && typeof res.data === "object" && "ok" in res.data) {
      if (res.data.ok) {
        const { ok: _ok, ...rest } = res.data as { ok: true } & Record<string, unknown>;
        void _ok;
        return rest as T;
      }
      throw new ApiError({
        status: res.status,
        message: res.data.error ?? "Request failed.",
        fieldErrors: res.data.errors,
      });
    }
    return res.data as T;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    const ax = err as AxiosError<{ error?: string; errors?: FieldErrors }>;
    const status = ax.response?.status ?? 0;
    const body = ax.response?.data;
    throw new ApiError({
      status,
      message: body?.error ?? ax.message ?? "Network error.",
      fieldErrors: body?.errors,
    });
  }
}
