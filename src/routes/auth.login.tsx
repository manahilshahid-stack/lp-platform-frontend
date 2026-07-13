import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { saveProfile, setToken, type Profile } from "@/lib/store";
import { api } from "@/lib/api/backend";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/auth/login")({
  head: () => ({
    meta: [{ title: "Sign in — Merantix LP Portal" }],
  }),
  component: LoginPage,
});

type AuthResponse = {
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

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api<AuthResponse>("/api/lp/login", {
        method: "POST",
        body: { email, password },
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
      navigate({ to: res.user.onboarding_completed ? "/home" : "/onboarding" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg.includes("401") ? "Invalid email or password." : "Something went wrong, please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to your private LP portal.">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Work email">
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="you@fund.com"
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/30" />
        </Field>
        <Field label="Password">
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/30" />
        </Field>

        {error && (
          <div className="rounded-lg bg-destructive/10 px-4 py-2.5 text-xs text-destructive">{error}</div>
        )}

        <button type="submit" disabled={loading}
          className="group mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-foreground px-4 py-3.5 text-sm font-semibold text-background transition hover:opacity-90 disabled:opacity-50">
          {loading ? "Signing in…" : "Sign in"}
          {!loading && <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        First time here?{" "}
        <Link to="/auth/register" className="font-semibold text-foreground underline-offset-4 hover:underline">
          Create an account
        </Link>
      </p>
    </AuthShell>
  );
}

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute -top-40 -right-40 h-[460px] w-[460px] rounded-full bg-highlight/35 blur-[140px]" />
      <div className="pointer-events-none absolute -bottom-40 -left-40 h-[460px] w-[460px] rounded-full bg-accent/25 blur-[140px]" />

      <header className="relative z-10 border-b border-foreground/10">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link to="/" className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.2em] text-muted-foreground transition hover:text-foreground">
            <ArrowLeft className="h-3 w-3" /> Back
          </Link>
          <Logo size={32} />
          <div className="w-12" />
        </div>
      </header>

      <main className="relative z-10 mx-auto flex max-w-md flex-col px-6 py-16">
        <div className="rounded-3xl border border-foreground/10 bg-card/80 p-8 shadow-elegant backdrop-blur">
          <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-foreground">Limited Partner</div>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight">{title}</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>
          <div className="mt-7">{children}</div>
        </div>
      </main>
    </div>
  );
}

export function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block space-y-1.5">
      <span className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
        {hint && <span className="text-[10px] font-normal normal-case tracking-normal text-muted-foreground/70">{hint}</span>}
      </span>
      {children}
    </label>
  );
}
