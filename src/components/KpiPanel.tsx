import { useEffect, useState } from "react";
import { api } from "@/lib/api/backend";

// KPI dashboard beside the chat.
//
// Every number shown here is read verbatim from the KPI extraction of a
// quarterly report — no AI runs when this renders, so nothing can be made up.
// Hovering a row shows the exact sentence from the report the value came from.

type Kpi = {
  label: string;
  type: string;
  value: number | string;
  currency?: string | null;
  source_text?: string | null;
};

type Period = {
  period: string | null;
  year: number;
  quarter: number;
  uploaded: string;
  kpis: Record<string, Kpi>;
};

type KpiResponse = { company: string; periods: Period[] };

const POLL_MS = 60_000;

function fmt(k: Kpi): string {
  const v = k.value;
  if (typeof v !== "number") return String(v);
  let s: string;
  if (Math.abs(v) >= 1e6) s = (v / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
  else if (Math.abs(v) >= 1e3) s = (v / 1e3).toFixed(0) + "k";
  else s = String(v);
  return k.currency ? `${s} ${k.currency}` : s;
}

export function KpiPanel() {
  const [companies, setCompanies] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [data, setData] = useState<KpiResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // Companies that actually have KPI data
  useEffect(() => {
    api<{ companies: string[] }>("/api/lp/kpis/companies")
      .then((r) => {
        setCompanies(r.companies);
        if (r.companies.length > 0) setSelected((s) => s ?? r.companies[0]);
      })
      .catch(() => setCompanies([]))
      .finally(() => setLoading(false));
  }, []);

  // Load + live-refresh the selected company's KPIs
  useEffect(() => {
    if (!selected) return;
    let cancelled = false;
    const load = () =>
      api<KpiResponse>("/api/lp/kpis", { query: { company: selected } })
        .then((r) => { if (!cancelled) setData(r); })
        .catch(() => { /* keep last state */ });
    load();
    const t = setInterval(load, POLL_MS);
    return () => { cancelled = true; clearInterval(t); };
  }, [selected]);

  if (loading || companies.length === 0) return null;

  const periods = data?.periods ?? [];
  const latest = periods.length > 0 ? periods[periods.length - 1] : null;
  const prev = periods.length > 1 ? periods[periods.length - 2] : null;

  return (
    <aside className="hidden w-72 shrink-0 xl:block">
      <div className="sticky top-6 rounded-2xl border border-border bg-card p-4">
        <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Company KPIs
        </div>

        <select
          value={selected ?? ""}
          onChange={(e) => setSelected(e.target.value)}
          className="mb-1 w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm font-semibold outline-none focus:border-accent"
        >
          {companies.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        {latest ? (
          <>
            <div className="mb-3 text-[11px] text-muted-foreground">
              As reported for {latest.period}
              {prev ? ` · vs ${prev.period}` : ""}
            </div>

            <div className="divide-y divide-border/60">
              {Object.entries(latest.kpis).map(([key, k]) => {
                const p = prev?.kpis[key];
                return (
                  <div
                    key={key}
                    title={k.source_text ?? undefined}
                    className="flex items-start justify-between gap-2 py-2 cursor-help"
                  >
                    <span className="text-xs text-muted-foreground">{k.label}</span>
                    <span className="text-right">
                      <span className="block text-sm font-bold">{fmt(k)}</span>
                      {p && (
                        <span className="block text-[10px] text-muted-foreground">
                          {fmt(p)} in {prev!.period}
                        </span>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="mt-3 border-t border-border/60 pt-2 text-[10px] leading-relaxed text-muted-foreground">
              Values verbatim from the {latest.period} report (uploaded {latest.uploaded}).
              Hover a metric for its source quote. Updates automatically.
            </div>
          </>
        ) : (
          <div className="py-3 text-xs text-muted-foreground">
            No report KPIs available yet.
          </div>
        )}
      </div>
    </aside>
  );
}
