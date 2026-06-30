import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api/backend";
import { ArrowUpRight, Search } from "lucide-react";

export const Route = createFileRoute("/_app/companies")({
  head: () => ({
    meta: [
      { title: "All companies — Merantix LP Portal" },
      { name: "description", content: "Browse every Merantix Capital portfolio company." },
    ],
  }),
  component: CompaniesIndex,
});

type Company = {
  id: string;
  name: string;
  tagline: string;
  category: string;
  stage: string;
  website: string;
  status: "Active" | "Exited" | "Stealth";
  logo: string;
  color: string;
};

function CompaniesIndex() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"All" | "Active" | "Exited" | "Stealth">("All");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<Company[]>("/api/lp/companies")
      .then((data) => setCompanies(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return companies.filter((c) => {
      if (status !== "All" && c.status !== status) return false;
      if (!q) return true;
      const s = q.toLowerCase();
      return c.name.toLowerCase().includes(s) || c.tagline.toLowerCase().includes(s) || c.category.toLowerCase().includes(s);
    });
  }, [q, status, companies]);

  const statuses = ["All", "Active", "Exited", "Stealth"] as const;

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 space-y-8">
      <header>
        <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-accent">Directory</div>
        <h1 className="mt-1 font-display text-4xl font-bold tracking-tight md:text-5xl">
          Browse the <span className="highlight-marker">portfolio</span>.
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          {companies.length} companies across the Merantix Capital portfolio. Click any company to read the profile and start a dedicated chat.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, sector or focus…"
            className="w-full rounded-full border border-border bg-card py-2.5 pl-9 pr-4 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/30" />
        </div>
        <div className="flex items-center gap-1.5">
          {statuses.map((s) => (
            <button key={s} onClick={() => setStatus(s)}
              className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider transition ${
                status === s ? "border-foreground bg-foreground text-background" : "border-border bg-card text-muted-foreground hover:border-foreground/30"
              }`}>{s}</button>
          ))}
        </div>
        <div className="ml-auto text-[11px] uppercase tracking-wider text-muted-foreground">
          {filtered.length} result{filtered.length === 1 ? "" : "s"}
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse h-40 rounded-2xl border border-border bg-card" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((c) => (
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
                <h3 className="mt-4 font-display text-lg font-bold tracking-tight">{c.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{c.tagline}</p>
                <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-[11px] text-muted-foreground">
                  <span>{c.category}</span>
                  <ArrowUpRight className="h-3.5 w-3.5 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground" />
                </div>
              </Link>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
              No companies match that filter.
            </div>
          )}
        </>
      )}
    </div>
  );
}
