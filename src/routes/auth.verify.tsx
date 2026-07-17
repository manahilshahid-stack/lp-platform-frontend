import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { saveProfile, setToken, type Profile } from "@/lib/store";
import { api } from "@/lib/api/backend";
import { ArrowRight, Mail, RefreshCw } from "lucide-react";
import { AuthShell } from "./auth.login";

export const Route = createFileRoute("/auth/verify")({
  head: () => ({
    meta: [{ title: "Verify your email — Merantix LP Portal" }],
  }),
  component: VerifyPage,
});

type VerifyResponse = {
  ok: boolean;
  token: string;
  user: {
    id: number;
    email: string;
    name: string;
    organization: string | null;
    interest_areas: string[];
    looking_for: string[];
    about_yourself: string;
    onboarding_completed: boolean;
  };
};

const PENDING_EMAIL_KEY = "lp_pending_verify_email";

export function savePendingEmail(email: string) {
  if (typeof localStorage !== "undefined") localStorage.setItem(PENDING_EMAIL_KEY, email);
}

function loadPendingEmail(): string {
  if (typeof localStorage === "undefined") return "";
  return localStorage.getItem(PENDING_EMAIL_KEY) ?? "";
}

function clearPendingEmail() {
  if (typeof localStorage !== "undefined") localStorage.removeItem(PENDING_EMAIL_KEY);
}

function VerifyPage() {
  const navigate = useNavigate();
  const [email] = useState(() => loadPendingEmail());
  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  // Redirect away if no pending email
  useEffect(() => {
    if (!email) navigate({ to: "/auth/register" });
  }, [email, navigate]);

  // Countdown for resend button
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const code = digits.join("");

  const handleInput = (i: number, val: string) => {
    // Allow paste of full 6-digit code
    if (val.length > 1) {
      const clean = val.replace(/\D/g, "").slice(0, 6);
      const next = [...digits];
      for (let j = 0; j < 6; j++) next[j] = clean[j] ?? "";
      setDigits(next);
      refs.current[Math.min(clean.length, 5)]?.focus();
      return;
    }
    const digit = val.replace(/\D/g, "");
    const next = [...digits];
    next[i] = digit;
    setDigits(next);
    if (digit && i < 5) refs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      refs.current[i - 1]?.focus();
    }
  };

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (code.length < 6) return;
    setError(null);
    setLoading(true);
    try {
      const res = await api<VerifyResponse>("/api/lp/verify-otp", {
        method: "POST",
        body: { email, code },
        auth: false,
      });
      setToken(res.token);
      const nameParts = res.user.name.split(" ");
      const profile: Profile = {
        email: res.user.email,
        name: res.user.name,
        firstName: nameParts[0],
        lastName: nameParts.slice(1).join(" ") || undefined,
        company: res.user.organization ?? undefined,
        role: "lp",
        interests: res.user.interest_areas,
        lookingFor: res.user.looking_for[0] ?? "",
        bio: res.user.about_yourself,
        onboarded: res.user.onboarding_completed,
      };
      saveProfile(profile);
      clearPendingEmail();
      navigate({ to: res.user.onboarding_completed ? "/home" : "/onboarding" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("expired")) {
        setError("Code has expired. Request a new one below.");
      } else if (msg.includes("Invalid")) {
        setError("That code isn't right — double-check and try again.");
      } else {
        setError("Something went wrong. Please try again.");
      }
      setDigits(["", "", "", "", "", ""]);
      refs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  // Auto-submit once all 6 digits are filled
  useEffect(() => {
    if (code.length === 6 && !loading) submit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  const resend = async () => {
    if (resendCooldown > 0) return;
    try {
      await api("/api/lp/resend-otp", { method: "POST", body: { email }, auth: false });
      setResendCooldown(60);
      setError(null);
      setDigits(["", "", "", "", "", ""]);
      refs.current[0]?.focus();
    } catch {
      setError("Couldn't resend. Please wait a moment and try again.");
    }
  };

  return (
    <AuthShell
      title="Check your email"
      subtitle={`We sent a 6-digit code to ${email || "your email"}.`}
    >
      <div className="flex flex-col items-center gap-6">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-secondary">
          <Mail className="h-5 w-5" />
        </div>

        <form onSubmit={submit} className="w-full space-y-5">
          {/* 6-box OTP input */}
          <div className="flex justify-center gap-2">
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => { refs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={d}
                onChange={(e) => handleInput(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                onFocus={(e) => e.target.select()}
                className={`h-14 w-11 rounded-xl border text-center text-xl font-bold outline-none transition
                  focus:border-accent focus:ring-2 focus:ring-accent/30
                  ${d ? "border-foreground/40 bg-card" : "border-border bg-background"}`}
              />
            ))}
          </div>

          {error && (
            <div className="rounded-lg bg-destructive/10 px-4 py-2.5 text-xs text-destructive text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={code.length < 6 || loading}
            className="group flex w-full items-center justify-center gap-2 rounded-xl bg-foreground px-4 py-3.5 text-sm font-semibold text-background transition hover:opacity-90 disabled:opacity-40"
          >
            {loading ? "Verifying…" : "Verify email"}
            {!loading && <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />}
          </button>
        </form>

        <div className="text-center text-sm text-muted-foreground">
          Didn't receive it?{" "}
          <button
            onClick={resend}
            disabled={resendCooldown > 0}
            className="inline-flex items-center gap-1 font-semibold text-foreground underline-offset-4 hover:underline disabled:opacity-50 disabled:no-underline"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
          </button>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Wrong email?{" "}
          <Link
            to="/auth/register"
            className="font-semibold text-foreground underline-offset-4 hover:underline"
          >
            Start over
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
