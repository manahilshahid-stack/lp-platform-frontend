import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { api } from "@/lib/api/backend";
import { sectorSlug } from "./portfolio.index";
import { ArrowLeft, ArrowUpRight, Search } from "lucide-react";

export const Route = createFileRoute("/_app/portfolio/$sector")({
  head: ({ params }) => ({
    meta: [
      { title: `${decodeURIComponent(params.sector)} — Merantix Portfolio` },
    ],
  }),
  component: SectorDetail,
});

type SectorCompany = {
  id: string;
  name: string;
  tagline: string;
  category: string;
  stage: string;
  status: string;
  logo: string;
  color: string;
};

type SectorResponse = {
  sector_name: string;
  slug: string;
  companies: SectorCompany[];
  investigations: any[];
};

function SectorDetail() {
  const { sector } = Route.useParams();
  const [search, setSearch] = useState("");
  const [data, setData] = useState<SectorResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    api<SectorResponse>(`/api/lp/portfolio/sectors/${sector}`)
      .then((res) => setData(res))
      .catch((err) => {
        if (err?.status === 404 || String(err).includes("404")) {
          setNotFound(true);
        } else {
          console.error(err);
          setNotFound(true);
        }
      })
      .finally(() => setLoading(false));
  }, [sector]);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-10 space-y-10">
        <div className="animate-pulse h-6 w-40 rounded-full bg-secondary" />
        <div className="animate-pulse h-12 w-64 rounded-2xl bg-secondary" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse h-40 rounded-2xl border border-border bg-card" />
          ))}
        </div>
      </div>
    );
  }

  if (notFound || !data) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-10">
        <Link to="/portfolio" className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground transition hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> All sectors
        </Link>
        <div className="mt-10 rounded-2xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
          Sector not found.
        </div>
      </div>
    );
  }

  const { sector_name: sectorName, companies: allCompanies } = data;

  const companies = allCompanies.filter((c) =>
    !search || `${c.name} ${c.tagline}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 space-y-10">
      {/* Breadcrumb / step */}
      <div className="flex items-center justify-between gap-3">
        <Link to="/portfolio" className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground transition hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> All sectors
        </Link>
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          <span>Sector</span>
          <span className="h-px w-6 bg-border" />
          <span className="text-accent">Step 2 · Pick a company</span>
          <span className="h-px w-6 bg-border" />
          <span>Chat</span>
        </div>
      </div>

      <section>
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">Sector</div>
        <h1 className="mt-1 font-display text-4xl font-bold tracking-tight md:text-5xl">
          {sectorName}<span className="text-accent">.</span>
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          {allCompanies.length} portfolio {allCompanies.length === 1 ? "company" : "companies"}.
          Pick a company to open its profile and chat.
        </p>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-display text-2xl font-bold">Portfolio</h2>
          {allCompanies.length > 4 && (
            <div className="relative max-w-xs flex-1">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search this sector…"
                className="w-full rounded-full border border-border bg-card py-2 pl-9 pr-4 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/30" />
            </div>
          )}
        </div>

        {companies.length === 0 ? (
          <EmptyState text={`No portfolio companies in ${sectorName} yet.`} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {companies.map((c) => (
              <Link key={c.id} to="/company/$companyId" params={{ companyId: c.id }}
                className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 transition hover:border-foreground/30 hover:shadow-elegant">
                <div className="flex items-start justify-between gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-lg font-display text-lg font-bold text-primary-foreground" style={{ background: c.color }}>
                    {c.logo}
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                    c.status === "Active" ? "bg-highlight text-highlight-foreground" :
                    c.status === "Exited" ? "bg-primary text-primary-foreground" :
                    "bg-secondary text-muted-foreground"
                  }`}>{c.status}</span>
                </div>
                <h3 className="mt-4 font-display text-xl font-bold tracking-tight">{c.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{c.tagline}</p>
                <div className="mt-5 flex items-center justify-between border-t border-border pt-4 text-[11px]">
                  <span className="text-muted-foreground">{c.stage}</span>
                </div>
                <ArrowUpRight className="absolute right-5 top-5 h-4 w-4 -translate-y-1 translate-x-1 text-muted-foreground opacity-0 transition group-hover:translate-x-0 group-hover:translate-y-0 group-hover:opacity-100" />
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">{text}</div>;
}
