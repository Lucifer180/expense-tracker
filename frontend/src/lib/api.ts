// Small fetch wrapper: adds the JWT, turns FastAPI errors into readable messages.
export const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? "http://127.0.0.1:8000";
const TOKEN_KEY = "et_token";

export function getToken(): string | null {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
}
export function setToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch { /* storage unavailable: session stays in memory only */ }
}

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(fn: () => void) { onUnauthorized = fn; }

function detailToMessage(detail: unknown): string {
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail) && detail.length) {
    // Pydantic validation errors: [{loc: [...], msg: "..."}]
    const first = detail[0] as { loc?: unknown[]; msg?: string };
    const field = first.loc?.[first.loc.length - 1];
    return field ? `${String(field)}: ${first.msg}` : first.msg ?? "Invalid input";
  }
  return "Something went wrong";
}

export async function api<T>(path: string, options: RequestInit & { form?: Record<string, string> } = {}): Promise<T> {
  const headers = new Headers(options.headers);
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let body = options.body;
  if (options.form) {
    body = new URLSearchParams(options.form);
    headers.set("Content-Type", "application/x-www-form-urlencoded");
  } else if (body && typeof body === "string") {
    headers.set("Content-Type", "application/json");
  }

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { ...options, headers, body });
  } catch {
    throw new ApiError(0, "Can't reach the server. Is the backend running?");
  }

  if (res.status === 401 && token && !path.startsWith("/auth/login")) onUnauthorized?.();
  if (res.status === 204) return undefined as T;

  const data = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, detailToMessage(data?.detail));
  return data as T;
}

export const json = (value: unknown) => JSON.stringify(value);
