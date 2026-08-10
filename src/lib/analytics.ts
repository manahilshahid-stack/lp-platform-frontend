/**
 * analytics.ts — Lightweight UX event tracker for the Merantix LP Portal.
 *
 * Design principles:
 *  - Fire-and-forget: tracking never blocks the UI or throws visible errors.
 *  - Batched: events queue up and flush on route-change or every 8 seconds.
 *  - Session-scoped: a sessionStorage ID groups events per browser visit.
 *  - Direct-to-Railway: bypasses the CF Worker proxy to reduce overhead.
 *  - Zero PII on content: we track WHAT was clicked, never chat message text.
 */

import { getToken } from "@/lib/store";

// ── Config ────────────────────────────────────────────────────────────────────

const RAILWAY_URL =
  typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_API_URL
    ? (import.meta as any).env.VITE_API_URL
    : "https://intelligent-platform-production.up.railway.app";

const INGEST_URL = `${RAILWAY_URL}/api/analytics/events`;
const FLUSH_INTERVAL_MS = 8_000;
const MAX_QUEUE = 30;

// ── Session ID ────────────────────────────────────────────────────────────────

function getSessionId(): string {
  if (typeof window === "undefined") return "ssr";
  const KEY = "mx_analytics_session";
  let id = sessionStorage.getItem(KEY);
  if (!id) {
    id = crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    sessionStorage.setItem(KEY, id);
  }
  return id;
}

// ── Types ─────────────────────────────────────────────────────────────────────

export type EventType =
  | "page_view"
  | "company_view"
  | "chat_message"
  | "chat_session_start"
  | "feature_click"
  | "search";

export interface TrackEvent {
  event_type: EventType;
  event_name?: string;
  session_id: string;
  page_path?: string;
  referrer_path?: string;
  properties?: Record<string, unknown>;
  duration_ms?: number;
}

// ── Queue ─────────────────────────────────────────────────────────────────────

let _queue: TrackEvent[] = [];
let _flushTimer: ReturnType<typeof setTimeout> | null = null;
let _lastPath: string | null = null;
let _lastPathAt: number | null = null;

function _scheduleFlush() {
  if (_flushTimer !== null) return;
  _flushTimer = setTimeout(() => {
    _flushTimer = null;
    flush();
  }, FLUSH_INTERVAL_MS);
}

/** Send all queued events to the backend. Always resolves — never throws. */
export async function flush(): Promise<void> {
  if (typeof window === "undefined" || _queue.length === 0) return;
  const batch = _queue.splice(0, MAX_QUEUE);
  try {
    const token = getToken();
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    // Use sendBeacon when available (survives page unload)
    if (navigator.sendBeacon && batch.length <= 10) {
      const blob = new Blob([JSON.stringify({ events: batch })], {
        type: "application/json",
      });
      navigator.sendBeacon(INGEST_URL, blob);
    } else {
      await fetch(INGEST_URL, {
        method: "POST",
        headers,
        body: JSON.stringify({ events: batch }),
        keepalive: true,
      });
    }
  } catch {
    // Silently discard — tracking must never surface errors to the user
  }
}

// ── Core track function ───────────────────────────────────────────────────────

/**
 * Track a single UX event. Adds to queue, auto-flushes when queue is full.
 *
 * @example
 * track("company_view", "almetra", { sector: "Health" })
 * track("feature_click", "portfolio_grid")
 * track("chat_message", undefined, { session_id: "abc123" })
 */
export function track(
  event_type: EventType,
  event_name?: string,
  properties?: Record<string, unknown>,
): void {
  if (typeof window === "undefined") return;
  const ev: TrackEvent = {
    event_type,
    event_name,
    session_id: getSessionId(),
    page_path: window.location.pathname,
    properties,
  };
  _queue.push(ev);
  if (_queue.length >= MAX_QUEUE) {
    flush();
  } else {
    _scheduleFlush();
  }
}

// ── Page view helpers ─────────────────────────────────────────────────────────

/**
 * Call this on every route change. Tracks the new page_view and attaches
 * the time-on-page (duration_ms) to the PREVIOUS page's event.
 */
export function trackPageView(pathname: string): void {
  if (typeof window === "undefined") return;
  const now = Date.now();

  // Attach duration to the last page's event if we have the timestamp
  if (_lastPath !== null && _lastPathAt !== null && _queue.length > 0) {
    // Find the most recent page_view in queue and annotate it
    for (let i = _queue.length - 1; i >= 0; i--) {
      if (_queue[i].event_type === "page_view" && _queue[i].page_path === _lastPath) {
        _queue[i].duration_ms = now - _lastPathAt;
        break;
      }
    }
  }

  _lastPath = pathname;
  _lastPathAt = now;

  _queue.push({
    event_type: "page_view",
    event_name: _routeLabel(pathname),
    session_id: getSessionId(),
    page_path: pathname,
    referrer_path: _prevPath ?? undefined,
  });

  _prevPath = pathname;

  // Flush previous batch on route change so data arrives promptly
  if (_queue.length >= 2) flush();
  else _scheduleFlush();
}

let _prevPath: string | null = null;

/** Map a pathname to a human-readable label for Metabase grouping. */
function _routeLabel(path: string): string {
  if (path === "/" || path === "/home") return "home";
  if (path.startsWith("/companies/")) return "company_detail";
  if (path === "/companies") return "companies_list";
  if (path === "/chat") return "chat";
  if (path.startsWith("/portfolio/")) return "sector_detail";
  if (path === "/portfolio") return "portfolio";
  if (path === "/profile") return "profile";
  if (path === "/history") return "chat_history";
  return path.replace(/^\//, "").replace(/\//g, "_") || "unknown";
}

// ── Flush on tab hide / close ─────────────────────────────────────────────────

if (typeof window !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flush();
  });
  window.addEventListener("pagehide", () => flush());
}
