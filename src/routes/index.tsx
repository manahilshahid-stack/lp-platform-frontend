import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { loadProfile } from "@/lib/store";
import { api } from "@/lib/api/backend";
import { ArrowRight, ArrowUpRight, Mail, MessageSquare, LayoutGrid, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/Logo";

type PublicCompany = { name: string; sector: string };

const COLORS = [
  "oklch(0.92 0.25 120)",
  "oklch(0.72 0.21 55)",
  "oklch(0.18 0.01 60)",
  "oklch(0.65 0.12 85)",
];

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Merantix Capital — Limited Partner Portal" },
      { name: "description", content: "A private space for Merantix Capital Limited Partners — converse with an AI analyst, explore the portfolio, email yourself the key insights." },
    ],
  }),
  component: LPLanding,
});

function LPLanding() {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<PublicCompany[]>([]);

  useEffect(() => {
    const p = loadProfile();
    if (p?.onboarded) navigate({ to: "/home" });
  }, [navigate]);

  useEffect(() => {
    api<PublicCompany[]>("/api/lp/public/companies", { auth: false })
      .then(setCompanies)
      .catch(() => setCompanies([]));
  }, []);

  const rowA = [...companies, ...companies];
  const rowB = [...companies.slice().reverse(), ...companies];

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      {/* Ambient washes */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full bg-highlight/40 blur-[140px]" />
      <div className="pointer-events-none absolute bottom-[-220px] right-[-160px] h-[560px] w-[560px] rounded-full bg-accent/30 blur-[160px]" />
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-40" />

      {/* Top bar */}
      <header className="relative z-20 border-b border-foreground/10">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Logo size={36} />
          <div className="flex items-center gap-2">
            <Link to="/auth/login"
              className="hidden rounded-full border border-foreground/15 px-4 py-1.5 text-xs font-semibold transition hover:border-foreground/40 md:inline-flex">
              Sign in
            </Link>
            <Link to="/auth/register"
              className="rounded-full bg-foreground px-4 py-1.5 text-xs font-semibold text-background transition hover:opacity-90">
              Register
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 pt-16 pb-12 md:pt-24">
        <div className="grid items-start gap-10 lg:grid-cols-[1.15fr_1fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-foreground/15 bg-card/60 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-highlight" /> For Limited Partners · Private beta
            </div>

            <h1 className="mt-7 font-display text-[44px] font-bold leading-[0.92] tracking-tight sm:text-6xl lg:text-[80px]">
              Your private
              <br />
              window into
              <br />
              the <span className="highlight-marker">Merantix</span>
              <br />
              portfolio<span className="text-foreground">.</span>
            </h1>

            <p className="mt-7 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
              Converse with an AI analyst about any Merantix company, ask broader market
              questions, and email yourself the key insights — all in one quiet, private space.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link to="/auth/register"
                className="group inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3.5 text-sm font-semibold text-background transition hover:opacity-90">
                Create your account
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </Link>
              <Link to="/auth/login"
                className="inline-flex items-center gap-2 rounded-full border border-foreground/20 bg-card/60 px-6 py-3.5 text-sm font-semibold backdrop-blur transition hover:border-foreground/40">
                Sign in
              </Link>
            </div>

            <div className="mt-10 flex items-center gap-5 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-foreground" /> Confidential</span>
              <span className="h-1 w-1 rounded-full bg-border" />
              <span>Invite only</span>
              <span className="h-1 w-1 rounded-full bg-border" />
              <span>2016 → today</span>
            </div>
          </div>

          {/* Editorial visual */}
          <div className="relative">
            <div className="relative overflow-hidden rounded-3xl border border-foreground/10 bg-foreground p-7 text-background shadow-elegant">
              <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.22em] text-background/60">
                <span>Today · Live</span>
                <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-highlight" /> AI Analyst</span>
              </div>

              <div className="mt-6 space-y-3">
                <ChatBubble role="user">How is Vara doing in the German screening market?</ChatBubble>
                <ChatBubble role="ai">
                  <span className="block"><strong>Vara</strong> is now deployed across the majority of German mammography screening centers. Read rate up ~22% YoY.</span>
                </ChatBubble>
                <ChatBubble role="user">Which sectors is Merantix leaning into right now?</ChatBubble>
                <ChatBubble role="ai" loading />
              </div>

              <div className="mt-6 flex items-center justify-between rounded-2xl border border-background/15 bg-background/5 px-4 py-3 text-xs">
                <span className="text-background/70">End conversation</span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-highlight px-3 py-1 font-semibold text-highlight-foreground">
                  <Mail className="h-3 w-3" /> Email summary
                </span>
              </div>

              <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-highlight/30 blur-3xl" />
            </div>

            <div className="absolute -left-6 -bottom-6 hidden rounded-2xl border border-foreground/10 bg-card px-4 py-3 shadow-elegant md:block">
              <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Portfolio companies</div>
              <div className="mt-1 font-display text-2xl font-bold">{companies.length}<span className="text-foreground">.</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* Marquee — only render once data has loaded so animation starts fresh */}
      {companies.length > 0 && (
        <section className="relative z-10 border-y border-foreground/10 bg-card/40 py-6 backdrop-blur">
          <Marquee key={`a-${companies.length}`} items={rowA} />
          <div className="h-3" />
          <Marquee key={`b-${companies.length}`} items={rowB} reverse />
        </section>
      )}

      {/* Features */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 py-20">
        <div className="flex items-end justify-between gap-6">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-foreground">Inside the portal</div>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight md:text-5xl">Three things, done well.</h2>
          </div>
          <div className="hidden text-[11px] uppercase tracking-[0.2em] text-muted-foreground md:block">For LPs only</div>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          <FeatureCard n="01" icon={MessageSquare} title="Ask anything"
            body="Converse with an AI analyst about any portfolio company, a sector trend, or a market question. No dashboards to wrangle."
            tone="default" />
          <FeatureCard n="02" icon={LayoutGrid} title="Browse the portfolio"
            body="A clean, sector-first view of every Merantix Capital company. Click in for the team, partners and what they're shipping."
            tone="highlight" />
          <FeatureCard n="03" icon={Mail} title="Email the key insights"
            body="End any conversation with a one-tap summary delivered straight to your inbox. Quietly powerful."
            tone="dark" />
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 pb-24">
        <div className="overflow-hidden rounded-3xl border border-foreground/10 bg-foreground p-10 text-background md:p-14">
          <div className="grid items-center gap-8 md:grid-cols-[1fr_auto]">
            <div>
              <div className="text-[10px] uppercase tracking-[0.22em] text-background/60">Limited Partner access</div>
              <h3 className="mt-3 font-display text-3xl font-bold tracking-tight md:text-5xl">
                Step inside the <span className="text-highlight">portfolio</span>.
              </h3>
              <p className="mt-3 max-w-xl text-background/70">
                Sign in with the email tied to your fund commitment, or register a new account in under a minute.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Link to="/auth/register"
                className="group inline-flex items-center justify-between gap-3 rounded-full bg-highlight px-6 py-3.5 text-sm font-semibold text-highlight-foreground transition hover:opacity-90">
                Register
                <ArrowUpRight className="h-4 w-4 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </Link>
              <Link to="/auth/login"
                className="inline-flex items-center justify-between gap-3 rounded-full border border-background/20 px-6 py-3.5 text-sm font-semibold text-background transition hover:bg-background/5">
                Sign in
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
        <p className="mt-6 text-center text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          Private · Confidential · Limited Partners only
        </p>
      </section>
    </div>
  );
}

function Marquee({ items, reverse }: { items: PublicCompany[]; reverse?: boolean }) {
  return (
    <div className="relative overflow-hidden">
      <div className={`flex w-max gap-2 whitespace-nowrap ${reverse ? "animate-marquee-rev" : "animate-marquee"}`} style={{ animationDuration: "55s" }}>
        {items.map((c, i) => (
          <span key={`${c.name}-${i}`} className="inline-flex items-center gap-2 rounded-full border border-foreground/10 bg-background px-3.5 py-1.5 text-[12px] font-medium">
            <span className="h-2 w-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
            {c.name}
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">· {c.sector}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function ChatBubble({ role, children, loading }: { role: "user" | "ai"; children?: React.ReactNode; loading?: boolean }) {
  const user = role === "user";
  return (
    <div className={`flex ${user ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-[13px] leading-snug ${user ? "bg-background text-foreground" : "border border-background/15 bg-background/5 text-background"}`}>
        {loading ? (
          <span className="inline-flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-highlight pulse-dot" />
            <span className="h-1.5 w-1.5 rounded-full bg-highlight pulse-dot" style={{ animationDelay: "0.15s" }} />
            <span className="h-1.5 w-1.5 rounded-full bg-highlight pulse-dot" style={{ animationDelay: "0.3s" }} />
          </span>
        ) : children}
      </div>
    </div>
  );
}

function FeatureCard({ n, icon: Icon, title, body, tone }: { n: string; icon: React.ElementType; title: string; body: string; tone: "default" | "highlight" | "dark" }) {
  const cls = tone === "highlight"
    ? "border-foreground/10 bg-highlight text-highlight-foreground"
    : tone === "dark"
      ? "border-foreground/10 bg-foreground text-background"
      : "border-border bg-card";
  const muted = tone === "dark" ? "text-background/70" : tone === "highlight" ? "text-foreground/75" : "text-muted-foreground";

  return (
    <div className={`group relative overflow-hidden rounded-3xl border p-7 transition hover:-translate-y-0.5 hover:shadow-elegant ${cls}`}>
      <div className="flex items-start justify-between">
        <div className={`grid h-11 w-11 place-items-center rounded-xl ${tone === "dark" ? "bg-background/10" : tone === "highlight" ? "bg-foreground/10" : "bg-secondary"}`}>
          <Icon className="h-5 w-5" />
        </div>
        <span className={`font-mono text-xs ${muted}`}>{n}</span>
      </div>
      <h3 className="mt-6 font-display text-2xl font-bold tracking-tight">{title}</h3>
      <p className={`mt-2 text-sm leading-relaxed ${muted}`}>{body}</p>
    </div>
  );
}
