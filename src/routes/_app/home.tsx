import { createFileRoute, Link } from "@tanstack/react-router";
import { useProfile } from "@/lib/store";
import { ArrowUpRight, LayoutGrid, MessageSquare, Rss, Sparkles } from "lucide-react";

export const Route = createFileRoute("/_app/home")({
  head: () => ({
    meta: [
      { title: "Home — Merantix LP Portal" },
      { name: "description", content: "Your private LP home — chat, sectors, portfolio." },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const profile = useProfile();
  if (!profile) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="h-5 w-28 rounded-full bg-secondary" />
        <div className="mt-4 h-12 w-full max-w-md rounded-2xl bg-secondary" />
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[0, 1, 2].map((i) => <div key={i} className="h-48 rounded-3xl border border-border bg-card" />)}
        </div>
      </div>
    );
  }

  const firstName = profile.firstName || profile.name.split(" ")[0];

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 space-y-12">
      {/* Greeting */}
      <header>
        <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-foreground">LP Portal</div>
        <h1 className="mt-1 font-display text-4xl font-bold tracking-tight md:text-5xl">
          Welcome back, {firstName}<span className="text-foreground">.</span>
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Pick where you'd like to go. Everything here is private to you.
        </p>
      </header>

      {/* Funnel cards */}
      <section className="grid gap-4 md:grid-cols-3">
        <FunnelCard
          to="/chat"
          tone="dark"
          eyebrow="01 · Conversational"
          icon={Sparkles}
          title="Merantix AI Analyst: Laura"
          body="Ask anything — a Merantix company, a sector, or a wider market question. Email yourself the summary."
        />
        <FunnelCard
          to="/portfolio"
          tone="highlight"
          eyebrow="02 · Thesis"
          icon={LayoutGrid}
          title="Merantix Thesis Sectors"
          body="See the sectors we back, with the companies and the deals we're evaluating in each."
        />
        <FunnelCard
          to="/companies"
          tone="default"
          eyebrow="03 · Directory"
          icon={MessageSquare}
          title="Browse the portfolio"
          body="A clean directory of every Merantix Capital company. Click in for the profile and a dedicated chat."
        />
      </section>

      {/* News Feed Banner */}
      <NewsFeedBanner />
    </div>
  );
}

function FunnelCard({
  to, tone, eyebrow, icon: Icon, title, body,
}: {
  to: "/chat" | "/portfolio" | "/companies";
  tone: "dark" | "highlight" | "default";
  eyebrow: string;
  icon: React.ElementType;
  title: string;
  body: string;
}) {
  const cls =
    tone === "dark"
      ? "border-foreground/10 bg-foreground text-background"
      : tone === "highlight"
        ? "border-foreground/10 bg-highlight text-highlight-foreground"
        : "border-border bg-card";
  const muted = tone === "dark" ? "text-background/70" : tone === "highlight" ? "text-foreground/75" : "text-muted-foreground";
  const chip = tone === "dark" ? "bg-background/10" : tone === "highlight" ? "bg-foreground/10" : "bg-secondary";

  return (
    <Link to={to}
      className={`group relative flex flex-col overflow-hidden rounded-3xl border p-7 transition hover:-translate-y-0.5 hover:shadow-elegant ${cls}`}>
      <div className="flex items-start justify-between">
        <div className={`grid h-11 w-11 place-items-center rounded-xl ${chip}`}>
          <Icon className="h-5 w-5" />
        </div>
        <ArrowUpRight className={`h-4 w-4 ${muted} transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5`} />
      </div>
      <div className={`mt-6 text-[10px] font-semibold uppercase tracking-[0.22em] ${muted}`}>{eyebrow}</div>
      <h3 className="mt-1 font-display text-xl font-bold tracking-tight">{title}</h3>
      <p className={`mt-2 text-sm leading-relaxed ${muted}`}>{body}</p>
    </Link>
  );
}

function NewsFeedBanner() {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-border bg-card p-8 md:p-10">
      {/* Subtle background pattern */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{ backgroundImage: "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)", backgroundSize: "24px 24px" }} />

      <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-5">
          <div className="grid h-14 w-14 flex-shrink-0 place-items-center rounded-2xl bg-secondary">
            <Rss className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                04 · News Feed
              </div>
              <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Coming Soon
              </span>
            </div>
            <h2 className="mt-1 font-display text-2xl font-bold tracking-tight">Portfolio News &amp; Updates</h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
              Live news, press releases, and milestone updates from across the Merantix Capital portfolio —
              aggregated in one feed, filtered to what matters to you.
            </p>
          </div>
        </div>

        {/* Placeholder cards */}
        <div className="flex flex-shrink-0 flex-col gap-2 md:w-56">
          {["Funding announcements", "Product launches", "Press coverage"].map((label) => (
            <div key={label}
              className="flex items-center gap-3 rounded-xl border border-border bg-background/60 px-3.5 py-2.5 opacity-50">
              <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
              <span className="text-xs text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
