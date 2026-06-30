// Generic client-side error reporter.
// Previously forwarded to Lovable's error capture SDK — now just logs to console.
// Swap the body of reportLovableError for Sentry/Datadog/etc. if needed.

export function reportLovableError(error: unknown, context: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  console.error("[app error]", error, context);
}
