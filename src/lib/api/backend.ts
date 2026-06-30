import { callBackend } from "./backend.functions";
import { getToken } from "@/lib/store";

// Thin client-side helper — proxies all requests through the Cloudflare Worker
// server function so the browser never talks to Railway directly.
// Automatically injects the stored Bearer token when present.
export async function api<T = unknown>(
  path: string,
  opts: {
    method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    body?: unknown;
    query?: Record<string, string>;
    /** Pass false to skip auth (e.g. login / register calls) */
    auth?: boolean;
  } = {},
): Promise<T> {
  const token = opts.auth !== false ? (getToken() ?? undefined) : undefined;
  const res = await callBackend({
    data: { path, method: opts.method ?? "GET", body: opts.body, query: opts.query, token },
  });
  if (!res.ok) {
    const detail = typeof res.body === "string" ? res.body : JSON.stringify(res.body);
    throw new Error(`Backend ${res.status}: ${detail}`);
  }
  return res.body as T;
}
