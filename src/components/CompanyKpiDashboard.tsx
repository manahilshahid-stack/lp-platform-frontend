import { useEffect, useState } from "react";
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip,
} from "recharts";
import { BarChart3 } from "lucide-react";
import { api } from "@/lib/api/backend";

// Performance dashboard for one portfolio company — chart-first layout.
//
// Every value comes verbatim from the KPI extraction of an uploaded quarterly
// report — no AI runs at render time and nothing is estimated. The only
// computed figures are the "vs previous quarter" percentage deltas, which are
// plain arithmetic on those reported values. Hover a stat card for the exact
// sentence in the report the number came from.

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
  quarter: number | null;   // set for quarterly reports
  month?: number | null;    // set for monthly reports (e.g. "2024-10")
  uploaded: string;
  kpis: Record<string, Kpi>;
};

type KpiResponse = { company: string; periods: Period[] };

const POLL_MS = 60_000;

const KPI_ORDER = [
  "revenue", "arr", "cash_position", "monthly_burn",
  "runway_months", "headcount", "customers",
];

// The big area chart uses the first of these that has data.
const PRIMARY_MONEY = ["revenue", "arr", "cash_position"];

function fmtNum(v: number, currency?: string | null): string {
  let s: string;
  if (Math.abs(v) >= 1e6) s = (v / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
  else if (Math.abs(v) >= 1e3) s = (v / 1e3).toFixed(0) + "k";
  else s = `${v}`;
  return currency ? `${s} ${currency}` : s;
}

function delta(cur: number, prev: number): string | null {
  if (!prev) return null;
  const pct = ((cur - prev) / Math.abs(prev)) * 100;
  const sign = pct >= 0 ? "+" : "";
  return `${sign}${pct.toFixed(0)}%`;
}

const tooltipStyle = {
  borderRadius: 10,
  border: "1px solid var(--border)",
  background: "var(--card)",
  fontSize: 12,
};

// Quarterly view: one entry per quarter, using the LATEST report within that
// quarter (point-in-time metrics like cash/ARR/headcount are "as of quarter
// end" — nothing is summed or invented; every value is still a real reported
// number with its source quote).
function toQuarterly(periods: Period[]): Period[] {
  const byQuarter = new Map<string, Period>();
  for (const p of periods) {
    const q = p.quarter ?? (p.month ? Math.ceil(p.month / 3) : null);
    if (q == null) continue;
    const key = `${p.year}-Q${q}`;
    byQuarter.set(key, { ...p, period: key, quarter: q });  // later entries overwrite = latest in quarter
  }
  return Array.from(byQuarter.values());
}

export function CompanyKpiDashboard({ companyName }: { companyName: string }) {
  const [data, setData] = useState<KpiResponse | null>(null);
  const [status, setStatus] = useState<string>("loading");
  const [view, setView] = useState<"reports" | "quarterly">("reports");

  useEffect(() => {
    let cancelled = false;
    const load = () =>
      api<KpiResponse>("/api/lp/kpis", { query: { company: companyName } })
        .then((r) => {
          if (cancelled) return;
          setData(r);
          setStatus(r.periods.length > 0 ? "ok" : "empty");
        })
        .catch((e: Error) => {
          if (cancelled) return;
          const m = /Backend (\d+)/.exec(e.message);
          setStatus(m ? `http_${m[1]}` : "network");
        });
    load();
    const t = setInterval(load, POLL_MS);
    return () => { cancelled = true; clearInterval(t); };
  }, [companyName]);

  const rawPeriods = data?.periods ?? [];
  const periods = view === "quarterly" ? toQuarterly(rawPeriods) : rawPeriods;
  const hasMonthly = rawPeriods.some((p) => p.month);

  // Always render a visible state so problems are self-diagnosing.
  if (status !== "ok") {
    const msg: Record<string, string> = {
      loading: "Loading KPI data…",
      empty: `No KPI data extracted yet from ${companyName}'s quarterly reports. Reports may still be processing, or KPI extraction produced no values — check the document pages in the admin portal.`,
      http_404: "KPI endpoint not found — the backend on Railway is running an older version without /api/lp/kpis. Redeploy the backend.",
      http_403: `${companyName} is not recognised as a portfolio company by the backend (CRM stage/name mismatch).`,
      http_401: "Not authenticated — try logging out and back in.",
      network: "Could not reach the backend.",
    };
    return (
      <section className="rounded-2xl border border-border bg-card p-5">
        <div className="mb-1 flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-bold uppercase tracking-wider">Performance dashboard</h2>
        </div>
        <p className="text-xs text-muted-foreground">{msg[status] ?? `Unexpected error (${status}).`}</p>
      </section>
    );
  }

  const latest = periods[periods.length - 1];
  const prev = periods.length > 1 ? periods[periods.length - 2] : null;

  // Numeric history per KPI across all periods (real values only)
  const history = (key: string) =>
    periods
      .map((p) => ({
        period: p.period ?? `Q${p.quarter} ${p.year}`,
        value: typeof p.kpis[key]?.value === "number" ? (p.kpis[key]!.value as number) : null,
        currency: p.kpis[key]?.currency ?? null,
        source: p.kpis[key]?.source_text ?? null,
      }))
      .filter((d) => d.value !== null);

  // Big area chart: first money KPI with data
  const primaryKey = PRIMARY_MONEY.find((k) => history(k).length > 0) ?? null;
  const primarySeries = primaryKey ? history(primaryKey) : [];
  const primaryLabel = primaryKey ? (latest.kpis[primaryKey]?.label ??
    periods.find((p) => p.kpis[primaryKey])?.kpis[primaryKey]?.label ?? primaryKey) : "";
  const primaryCurrency = primarySeries[primarySeries.length - 1]?.currency ?? "";

  // Mini bar charts: every other numeric KPI that has at least one value
  const miniKeys = KPI_ORDER.filter(
    (k) => k !== primaryKey && history(k).length > 0,
  );

  // Quarter comparison: always the last up-to-4 quarters, for every company.
  const cmpQuarters = toQuarterly(rawPeriods).slice(-4);
  const cmpKeys = KPI_ORDER.filter((k) =>
    cmpQuarters.some((q) => typeof q.kpis[k]?.value === "number"),
  );

  const cards = KPI_ORDER
    .filter((k) => latest.kpis[k] !== undefined)
    .map((k) => {
      const cur = latest.kpis[k];
      const prv = prev?.kpis[k];
      const d = typeof cur.value === "number" && typeof prv?.value === "number"
        ? delta(cur.value, prv.value) : null;
      return { key: k, cur, d };
    });

  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      {/* Header */}
      <div className="mb-1 flex items-center gap-2">
        <BarChart3 className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-sm font-bold uppercase tracking-wider">Performance dashboard</h2>
        <div className="ml-auto flex items-center gap-2">
          {hasMonthly && (
            <div className="flex overflow-hidden rounded-full border border-border text-[10px] font-semibold uppercase tracking-wider">
              {(["reports", "quarterly"] as const).map((v) => (
                <button key={v} onClick={() => setView(v)}
                  className={`px-2.5 py-1 transition ${view === v
                    ? "bg-foreground text-background"
                    : "bg-background text-muted-foreground hover:text-foreground"}`}>
                  {v === "reports" ? "Monthly" : "Quarterly"}
                </button>
              ))}
            </div>
          )}
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {periods.length > 1
              ? `Last ${periods.length} ${view === "quarterly" ? "quarters" : "reports"}`
              : `As reported for ${latest.period}`}
          </span>
        </div>
      </div>
      <p className="mb-4 text-[10px] text-muted-foreground">
        All figures verbatim from {data!.company}&apos;s reports
        (latest uploaded {latest.uploaded}). Hover a metric for its source sentence.
        {view === "quarterly" && " Quarterly view shows each quarter's latest report (values as of quarter end); % changes are quarter-over-quarter."}
      </p>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {cards.map(({ key, cur, d }) => (
          <div
            key={key}
            title={cur.source_text ?? undefined}
            className="cursor-help rounded-xl border border-border bg-background p-3.5"
          >
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {cur.label}
            </div>
            <div className="mt-1.5 font-display text-2xl font-bold tracking-tight">
              {typeof cur.value === "number" ? fmtNum(cur.value, cur.currency) : String(cur.value)}
            </div>
            {d && prev && (
              <div className={`mt-1 text-[10px] font-semibold ${
                d.startsWith("+") ? "text-emerald-600" : "text-red-500"
              }`}>
                ↗ {d} vs {prev.period}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Quarter-over-quarter comparison — always visible, all companies */}
      {cmpQuarters.length >= 1 && cmpKeys.length > 0 && (
        <div className="mt-5 overflow-x-auto rounded-xl border border-border bg-background p-4">
          <div className="mb-2 flex items-baseline justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Quarter comparison
            </span>
            <span className="text-[10px] text-muted-foreground">
              {cmpQuarters.length < 3
                ? "More columns appear as more quarters are reported"
                : `Last ${cmpQuarters.length} quarters`}
            </span>
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border text-left text-[10px] uppercase tracking-wider text-muted-foreground">
                <th className="py-1.5 pr-3 font-semibold">Metric</th>
                {cmpQuarters.map((q, i) => (
                  <th key={q.period} className={`py-1.5 pr-3 text-right font-semibold ${
                    i === cmpQuarters.length - 1 ? "text-foreground" : ""}`}>
                    {q.period}
                  </th>
                ))}
                {cmpQuarters.length >= 2 && (
                  <th className="py-1.5 text-right font-semibold">Δ QoQ</th>
                )}
              </tr>
            </thead>
            <tbody>
              {cmpKeys.map((k) => {
                const vals = cmpQuarters.map((q) =>
                  typeof q.kpis[k]?.value === "number" ? (q.kpis[k]!.value as number) : null);
                const label = cmpQuarters.map((q) => q.kpis[k]?.label).find(Boolean) ?? k;
                const cur = vals[vals.length - 1];
                const prv = vals.length >= 2 ? vals[vals.length - 2] : null;
                const d = cur != null && prv != null ? delta(cur, prv) : null;
                const currency = cmpQuarters.map((q) => q.kpis[k]?.currency).find(Boolean) ?? null;
                return (
                  <tr key={k} className="border-b border-border/50 last:border-0">
                    <td className="py-2 pr-3 text-muted-foreground">{label}</td>
                    {vals.map((v, i) => (
                      <td key={i}
                        title={cmpQuarters[i].kpis[k]?.source_text ?? undefined}
                        className={`cursor-help py-2 pr-3 text-right tabular-nums ${
                          i === vals.length - 1 ? "font-bold" : ""}`}>
                        {v != null ? fmtNum(v, currency) : "—"}
                      </td>
                    ))}
                    {cmpQuarters.length >= 2 && (
                      <td className={`py-2 text-right font-semibold ${
                        d?.startsWith("+") ? "text-emerald-600" : d ? "text-red-500" : "text-muted-foreground"}`}>
                        {d ?? "—"}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Big quarterly area chart (primary money KPI) */}
      {primaryKey && primarySeries.length >= 2 && (
        <div className="mt-5 rounded-xl border border-border bg-background p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Quarterly {primaryLabel} {primaryCurrency ? `(${primaryCurrency})` : ""}
            </div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Growth trajectory
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={primarySeries} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="kpiFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--foreground)" stopOpacity={0.18} />
                    <stop offset="100%" stopColor="var(--foreground)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="period" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  axisLine={{ stroke: "var(--border)" }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  tickFormatter={(v: number) => fmtNum(v)}
                  axisLine={false} tickLine={false} width={52} />
                <Tooltip
                  formatter={(v: number) => [fmtNum(v, primaryCurrency), primaryLabel]}
                  contentStyle={tooltipStyle}
                />
                <Area type="monotone" dataKey="value" stroke="var(--foreground)"
                  strokeWidth={2.5} fill="url(#kpiFill)" dot={{ r: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* KPI history — one mini bar chart per metric */}
      {miniKeys.length > 0 && (
        <div className="mt-5">
          <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            KPI history by quarter
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {miniKeys.map((k) => {
              const series = history(k);
              const label = periods.find((p) => p.kpis[k])?.kpis[k]?.label ?? k;
              const currency = series[series.length - 1]?.currency ?? "";
              return (
                <div key={k} className="rounded-xl border border-border bg-background p-3">
                  <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {label} {currency ? `(${currency})` : ""}
                  </div>
                  <div className="h-28 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={series} margin={{ top: 2, right: 4, left: 0, bottom: 0 }}>
                        <XAxis dataKey="period" tick={{ fontSize: 9, fill: "var(--muted-foreground)" }}
                          axisLine={{ stroke: "var(--border)" }} tickLine={false} />
                        <YAxis tick={{ fontSize: 9, fill: "var(--muted-foreground)" }}
                          tickFormatter={(v: number) => fmtNum(v)}
                          axisLine={false} tickLine={false} width={36} />
                        <Tooltip
                          formatter={(v: number) => [fmtNum(v, currency), label]}
                          contentStyle={tooltipStyle}
                        />
                        <Bar dataKey="value" fill="var(--foreground)" opacity={0.85}
                          radius={[5, 5, 0, 0]} barSize={26} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {periods.length === 1 && (
        <p className="mt-3 text-[10px] text-muted-foreground">
          Trend charts fill in as more quarterly reports arrive — currently showing {latest.period} only.
        </p>
      )}
    </section>
  );
}
