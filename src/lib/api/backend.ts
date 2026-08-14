import { callBackend } from "./backend.functions";
import { getToken, clearToken, clearProfile } from "@/lib/store";

// ---------------------------------------------------------------------------
// Session expiry handling
// ---------------------------------------------------------------------------

/**
 * Thrown when the backend returns 401. Callers should catch this and stay
 * silent — the user is already being redirected to the login page.
 */
export class SessionExpiredError extends Error {
  constructor() {
    super("session_expired");
    this.name = "SessionExpiredError";
  }
}

/**
 * Called on any 401 response. Wipes auth state and hard-redirects to login.
 * Returns `never` — always throws after scheduling the redirect.
 */
function handle401(): never {
  if (typeof window !== "undefined") {
    clearToken();
    clearProfile();
    window.location.href = "/auth/login";
  }
  throw new SessionExpiredError();
}

/**
 * Converts a non-401 HTTP error status into a user-friendly message.
 * Never exposes raw status codes, URLs, or JSON bodies.
 */
function friendlyError(status: number): string {
  if (status >= 500) return "Something went wrong on our end. Please try again in a moment.";
  if (status === 403) return "You don't have permission to view this.";
  if (status === 404) return "That content couldn't be found.";
  return "Something went wrong. Please try again.";
}

// Railway base URL — used directly for streaming (bypasses CF Worker proxy)
const RAILWAY_URL =
  typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_API_URL
    ? (import.meta as any).env.VITE_API_URL
    : "https://intelligent-platform-production.up.railway.app";

// Thin client-side helper — proxies all requests through the Cloudflare Worker
// server function so the browser never talks to Railway directly.
export async function api<T = unknown>(
  path: string,
  opts: {
    method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    body?: unknown;
    query?: Record<string, string>;
    auth?: boolean;
  } = {},
): Promise<T> {
  const token = opts.auth !== false ? (getToken() ?? undefined) : undefined;
  const res = await callBackend({
    data: { path, method: opts.method ?? "GET", body: opts.body, query: opts.query, token },
  });
  if (!res.ok) {
    if (res.status === 401) handle401();
    throw new Error(friendlyError(res.status));
  }
  return res.body as T;
}

/**
 * Direct browser → Railway call (same route the chat stream uses, bypassing
 * the CF Worker proxy). Use for simple GETs like the home page feeds.
 */
export async function apiDirect<T = unknown>(path: string): Promise<T> {
  const token = getToken();
  // cache: "no-store" + timestamp — Safari aggressively caches JSON GETs,
  // and a cached error response would otherwise replay forever.
  const sep = path.includes("?") ? "&" : "?";
  const res = await fetch(`${RAILWAY_URL}${path}${sep}_ts=${Date.now()}`, {
    cache: "no-store",
    headers: {
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) {
    if (res.status === 401) handle401();
    throw new Error(friendlyError(res.status));
  }
  return (await res.json()) as T;
}

export type StreamEvent =
  | { type: "session"; session_id: string }
  | { type: "status"; text: string }
  | { type: "token"; text: string }
  | { type: "done" };

/**
 * Stream chat directly from Railway (bypassing the CF Worker proxy).
 * Yields events as they arrive: session info first, then tokens, then done.
 */
export async function* streamChat(
  message: string,
  sessionId: string | null,
  companyName?: string,
): AsyncGenerator<StreamEvent> {
  const token = getToken();
  const url = `${RAILWAY_URL}/api/lp/chat/stream`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      message,
      session_id: sessionId,
      ...(companyName ? { company_name: companyName } : {}),
    }),
  });

  if (!response.ok) {
    if (response.status === 401) handle401();
    throw new Error(friendlyError(response.status));
  }

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // SSE messages are separated by double newlines
    const parts = buffer.split("\n\n");
    buffer = parts.pop() ?? "";

    for (const part of parts) {
      for (const line of part.split("\n")) {
        if (!line.startsWith("data: ")) continue;
        const data = line.slice(6).trim();
        if (!data) continue;
        try {
          const event = JSON.parse(data) as StreamEvent;
          yield event;
          if (event.type === "done") return;
        } catch {
          // ignore malformed chunks
        }
      }
    }
  }
}
