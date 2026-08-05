import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { apiDirect } from "@/lib/api/backend";
import { useProfile } from "@/lib/store";
import {
  ArrowUpRight, CalendarDays, ExternalLink, LayoutGrid, MapPin,
  Megaphone, MessageSquare, Newspaper, Sparkles,
} from "lucide-react";

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

      {/* Live feeds: events (Luma) + curated portfolio news */}
      <LiveFeeds />
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

type FeedEvent = {
  id: number; name: string; url: string | null; cover_url: string | null;
  location: string | null; starts_at: string | null;
};
type NewsEntry = {
  id: number; title: string; url: string; source: string | null;
  company: string | null; category: string; image_url: string | null;
  published_at: string | null;
};
type EventsResponse = { calendar_url: string | null; events: FeedEvent[] };
type NewsResponse = { highlight: NewsEntry | null; funding: NewsEntry[]; press: NewsEntry[]; merantix: NewsEntry[] };

const NEWS_TABS = [
  { key: "funding" as const, label: "Funding" },
  { key: "press" as const, label: "Press" },
  { key: "merantix" as const, label: "Merantix" },
];

function fmtDate(iso: string | null, withTime = false) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
}

function LiveFeeds() {
  const [events, setEvents] = useState<EventsResponse | null>(null);
  const [news, setNews] = useState<NewsResponse | null>(null);
  const [tab, setTab] = useState<"funding" | "press" | "merantix">("funding");
  const [feedError, setFeedError] = useState<string | null>(null);

  useEffect(() => {
    apiDirect<EventsResponse>("/api/lp/events?limit=3").then(setEvents).catch((e) => {
      console.error("events feed failed:", e);
      setFeedError((e as Error)?.message ?? String(e));
    });
    apiDirect<NewsResponse>("/api/lp/news?limit=5").then((n) => {
      setNews(n);
      // open the first tab that actually has content
      const first = NEWS_TABS.find((t) => n[t.key]?.length);
      if (first) setTab(first.key);
    }).catch((e) => {
      console.error("news feed failed:", e);
      setFeedError((e as Error)?.message ?? String(e));
    });
  }, []);

  const hasEvents = !!events?.events?.length;
  const hasNews = !!news && NEWS_TABS.some((t) => news[t.key]?.length);
  if (!hasEvents && !hasNews && !news?.highlight) {
    // Distinguish "nothing published yet" (stay invisible) from "request
    // failed" (show a small diagnostic so failures are never silent).
    if (!feedError) return null;
    return (
      <section className="rounded-3xl border border-border bg-card px-6 py-4">
        <p className="text-xs text-muted-foreground">
          News &amp; events feed couldn't load — <span className="font-mono">{feedError.slice(0, 200)}</span>
        </p>
      </section>
    );
  }

  return (
    <div className="space-y-4">
      {/* Highlight banner — only when something is pinned */}
      {news?.highlight && (
        <a href={news.highlight.url} target="_blank" rel="noreferrer"
          className="group flex items-center gap-4 rounded-3xl border border-foreground/10 bg-highlight px-6 py-4 text-highlight-foreground transition hover:-translate-y-0.5 hover:shadow-elegant">
          <div className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-xl bg-foreground/10">
            <Megaphone className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-foreground/70">
              Highlight{news.highlight.company ? ` · ${news.highlight.company}` : ""}
            </div>
            <div className="truncate font-display text-base font-bold tracking-tight md:text-lg">
              {news.highlight.title}
            </div>
          </div>
          <ArrowUpRight className="h-4 w-4 flex-shrink-0 text-foreground/70 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </a>
      )}

      <section className={`grid gap-4 ${hasEvents && hasNews ? "lg:grid-cols-2" : ""}`}>
        {/* Upcoming events */}
        {hasEvents && (
          <div className="flex min-h-[26rem] flex-col rounded-3xl border border-border bg-card p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-secondary">
                  <CalendarDays className="h-4 w-4" />
                </div>
                <h2 className="font-display text-lg font-bold tracking-tight">Upcoming events</h2>
              </div>
              {events?.calendar_url && (
                <a href={events.calendar_url} target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-[11px] font-semibold text-muted-foreground transition hover:border-foreground/30 hover:text-foreground">
                  View all <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
            <div className="mt-4 flex-1 space-y-3">
              {events!.events.map((e) => (
                <a key={e.id} href={e.url ?? events?.calendar_url ?? "#"} target="_blank" rel="noreferrer"
                  className="group flex items-center gap-4 rounded-2xl border border-border bg-background/60 p-3 transition hover:-translate-y-0.5 hover:border-foreground/30 hover:shadow-elegant">
                  {e.cover_url ? (
                    <img src={e.cover_url} alt="" loading="lazy"
                      className="h-16 w-16 flex-shrink-0 rounded-xl border border-border object-cover" />
                  ) : (
                    <div className="grid h-16 w-16 flex-shrink-0 place-items-center rounded-xl bg-secondary">
                      <CalendarDays className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm font-semibold leading-snug"
                        style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {e.name}
                      </span>
                      <ExternalLink className="mt-0.5 h-3 w-3 flex-shrink-0 text-muted-foreground transition group-hover:text-foreground" />
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
                      <span className="font-medium">{fmtDate(e.starts_at, true)}</span>
                      {e.location && (
                        <span className="inline-flex items-center gap-1 truncate"><MapPin className="h-3 w-3 flex-shrink-0" />{e.location}</span>
                      )}
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* News tabs */}
        {hasNews && (
          <div className="flex min-h-[26rem] flex-col rounded-3xl border border-border bg-card p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-secondary">
                  <Newspaper className="h-4 w-4" />
                </div>
                <h2 className="font-display text-lg font-bold tracking-tight">Portfolio news</h2>
              </div>
              <div className="flex gap-1 rounded-full border border-border bg-background p-1">
                {NEWS_TABS.map((t) => (
                  <button key={t.key} onClick={() => setTab(t.key)}
                    className={`rounded-full px-3.5 py-1 text-[11px] font-semibold transition ${
                      tab === t.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                    }`}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-4 flex-1 space-y-3">
              {(news![tab] ?? []).length === 0 && (
                <div className="grid h-full place-items-center py-10 text-center">
                  <div>
                    <Newspaper className="mx-auto h-6 w-6 text-muted-foreground/50" />
                    <p className="mt-2 text-sm text-muted-foreground">Nothing in {NEWS_TABS.find((t) => t.key === tab)?.label} yet.</p>
                  </div>
                </div>
              )}
              {(news![tab] ?? []).map((n) => (
                <a key={n.id} href={n.url} target="_blank" rel="noreferrer"
                  className="group flex items-center gap-4 rounded-2xl border border-border bg-background/60 p-3 transition hover:-translate-y-0.5 hover:border-foreground/30 hover:shadow-elegant">
                  {n.image_url ? (
                    <img src={n.image_url} alt="" loading="lazy"
                      className="h-16 w-16 flex-shrink-0 rounded-xl border border-border object-cover"
                      onError={(ev) => { (ev.target as HTMLImageElement).style.display = "none"; }} />
                  ) : (
                    <div className="grid h-16 w-16 flex-shrink-0 place-items-center rounded-xl bg-secondary font-display text-lg font-bold text-muted-foreground">
                      {(n.source ?? n.company ?? "N")[0].toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm font-semibold leading-snug"
                        style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {n.title}
                      </span>
                      <ExternalLink className="mt-0.5 h-3 w-3 flex-shrink-0 text-muted-foreground transition group-hover:text-foreground" />
                    </div>
                    <div className="mt-1 truncate text-[11px] text-muted-foreground">
                      {[n.company, n.source, fmtDate(n.published_at)].filter(Boolean).join(" · ")}
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
