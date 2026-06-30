import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// Server-side proxy to the Railway backend.
// The browser never talks to Railway directly — all requests go through this
// Cloudflare Worker server function, which forwards the Bearer token.

type JsonValue = string | number | boolean | null | JsonValue[] | { [k: string]: JsonValue };

const BASE = () => process.env.VITE_API_URL ?? "https://intelligent-platform-production.up.railway.app";

const requestSchema = z.object({
  path: z.string().min(1),
  method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]).default("GET"),
  body: z.unknown().optional(),
  query: z.record(z.string(), z.string()).optional(),
  // Auth token passed from client — forwarded as Authorization header to Railway
  token: z.string().optional(),
});

export const callBackend = createServerFn({ method: "POST" })
  .inputValidator((input) => requestSchema.parse(input))
  .handler(async ({ data }): Promise<{ ok: boolean; status: number; body: JsonValue }> => {
    const url = new URL(data.path.replace(/^\//, ""), BASE().replace(/\/?$/, "/"));
    if (data.query) {
      for (const [k, v] of Object.entries(data.query)) url.searchParams.set(k, v);
    }

    const res = await fetch(url.toString(), {
      method: data.method,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(data.token ? { Authorization: `Bearer ${data.token}` } : {}),
      },
      body: data.body !== undefined && data.method !== "GET" ? JSON.stringify(data.body) : undefined,
    });

    const text = await res.text();
    let body: JsonValue = text;
    try { body = JSON.parse(text) as JsonValue; } catch { /* keep as text */ }

    return { ok: res.ok, status: res.status, body };
  });
