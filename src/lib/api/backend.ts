import { callBackend } from "./backend.functions";
import { getToken } from "@/lib/store";

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
    const detail = typeof res.body === "string" ? res.body : JSON.stringify(res.body);
    throw new Error(`Backend ${res.status}: ${detail}`);
  }
  return res.body as T;
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
    throw new Error(`Backend ${response.status}`);
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
