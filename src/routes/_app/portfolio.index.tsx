import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { api } from "@/lib/api/backend";
import { ArrowUpRight, Compass, Search } from "lucide-react";

export const Route = createFileRoute("/_app/portfolio/")({
  head: () => ({
    meta: [
      { title: "Portfolio — Merantix Capital" },
      { name: "description", content: "Explore the Merantix Capital portfolio by sector." },
    ],
  }),
  component: PortfolioHub,
});

export function sectorSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

type Sector = {
  name: string;
  slug: string;
  company_count: number;
  investigation_count: number;
};

type PortfolioResponse = {
  sectors: Sector[];
  total_sectors: number;
  total_companies: number;
};

function PortfolioHub() {
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [totalSectors, setTotalSectors] = useState(0);
  const [totalCompanies, setTotalCompanies] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<PortfolioResponse>("/api/lp/portfolio/sectors")
      .then((data) => {
        setSectors(data.sectors);
        setTotalSectors(data.total_sectors);
        setTotalCompanies(data.total_companies);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 space-y-12">
      {/* Step indicator */}
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        <span className="text-accent">Step 1</span>
        <span className="h-px w-6 bg-border" />
        <span>Pick a sector</span>
        <span className="h-px w-6 bg-border" />
        <span>Pick a company</span>
        <span className="h-px w-6 bg-border" />
        <span>Chat</span>
      </div>

      <section>
        <h1 className="font-display text-4xl font-bold tracking-tight md:text-5xl">
          Start with a <span className="highlight-marker">sector.</span>
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Browse the Merantix Capital portfolio the way we think about it — by domain. Pick a sector to see the companies inside it.
        </p>

        <div className="mt-6 flex flex-wrap gap-6 text-sm">
          <Stat label="Sectors" value={totalSectors} />
          <Stat label="Portfolio companies" value={totalCompanies} />
        </div>
      </section>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse h-24 rounded-2xl border border-border bg-card" />
          ))}
        </div>
      ) : (
        <section className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          {sectors.map((s) => (
            <Link
              key={s.slug}
              to="/portfolio/$sector"
              params={{ sector: s.slug }}
              className="group relative rounded-2xl border border-border bg-card p-5 transition hover:border-foreground/40 hover:shadow-elegant"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="font-display text-lg font-bold tracking-tight">{s.name}</span>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground" />
              </div>
              <div className="mt-4 flex items-center gap-3 text-[11px] text-muted-foreground">
                <span><strong className="text-foreground">{s.company_count}</strong> portfolio</span>
              </div>
            </Link>
          ))}
        </section>
      )}

      <section className="rounded-2xl border border-dashed border-border p-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-secondary">
            <Compass className="h-4 w-4" />
          </div>
          <div>
            <div className="font-semibold">Looking for something specific?</div>
            <div className="text-sm text-muted-foreground">Ask the AI Analyst — it knows every company in the portfolio.</div>
          </div>
        </div>
        <Link to="/chat" className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90">
          <Search className="h-3.5 w-3.5" /> Open AI Analyst
        </Link>
      </section>
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div>
      <div className={`font-display text-2xl font-bold tracking-tight ${highlight ? "text-accent" : ""}`}>{value}</div>
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}
