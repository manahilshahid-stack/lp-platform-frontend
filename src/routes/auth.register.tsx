import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { api } from "@/lib/api/backend";
import { ArrowRight } from "lucide-react";
import { AuthShell, Field } from "./auth.login";
import { savePendingEmail } from "./auth.verify";

export const Route = createFileRoute("/auth/register")({
  head: () => ({
    meta: [{ title: "Register — Merantix LP Portal" }],
  }),
  component: RegisterPage,
});

type RegisterResponse = {
  ok: boolean;
  requires_verification: boolean;
  email: string;
};

function RegisterPage() {
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    try {
      const res = await api<RegisterResponse>("/api/lp/register", {
        method: "POST",
        body: { first_name: firstName, last_name: lastName, email, company, password },
        auth: false,
      });
      savePendingEmail(res.email);
      navigate({ to: "/auth/verify" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const raw = msg.replace(/^Backend \d+:\s*/, "");
      try {
        const parsed = JSON.parse(raw);
        setError(parsed.detail ?? raw);
      } catch {
        setError(raw || "Something went wrong, please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle="Tell us who you are. Takes under a minute."
    >
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="First name">
            <input required value={firstName} onChange={(e) => setFirstName(e.target.value)}
              placeholder="Jane"
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/30" />
          </Field>
          <Field label="Last name">
            <input required value={lastName} onChange={(e) => setLastName(e.target.value)}
              placeholder="Doe"
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/30" />
          </Field>
        </div>

        <Field label="Work email">
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="you@fund.com"
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/30" />
        </Field>

        <Field label="Company" hint="Optional">
          <input value={company} onChange={(e) => setCompany(e.target.value)}
            placeholder="Your fund or firm"
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/30" />
        </Field>

        <Field label="Password">
          <input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder="Min. 8 characters"
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/30" />
        </Field>

        {error && (
          <div className="rounded-lg bg-destructive/10 px-4 py-2.5 text-xs text-destructive">{error}</div>
        )}

        <button type="submit" disabled={loading}
          className="group mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-foreground px-4 py-3.5 text-sm font-semibold text-background transition hover:opacity-90 disabled:opacity-50">
          {loading ? "Creating account…" : "Create account"}
          {!loading && <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already registered?{" "}
        <Link to="/auth/login" className="font-semibold text-foreground underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
