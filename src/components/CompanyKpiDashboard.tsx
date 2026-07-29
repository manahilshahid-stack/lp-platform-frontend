import { useEffect, useState } from "react";
import {
  ResponsiveContainer, ComposedChart, Line, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend,
} from "recharts";
import { BarChart3 } from "lucide-react";
import { api } from "@/lib/api/backend";

// Performance dashboard for one portfolio company.
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
  quarter: number;
  uploaded: string;
  kpis: Record<string, Kpi>;
};

type KpiResponse = { company: string; periods: Period[] };

const POLL_MS = 60_000;

// Display order; only KPIs actually present in the reports are rendered.
const CARD_ORDER = [
  "revenue", "arr", "cash_position", "monthly_burn",
  "runway_months", "headcount", "customers",
];

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

export function CompanyKpiDashboard({ companyName }: { companyName: string }) {
  const [data, setData] = useState<KpiResponse | null>(null);
  const [status, setStatus] = useState<string>("loading");

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

  const periods = data?.periods ?? [];

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

  // Chart series: one row per quarter with whatever KPIs exist
  const chartData = periods.map((p) => ({
    period: p.period ?? `Q${p.quarter} ${p.year}`,
    revenue: typeof p.kpis.revenue?.value === "number" ? p.kpis.revenue.value : null,
    arr: typeof p.kpis.arr?.value === "number" ? p.kpis.arr.value : null,
    burn: typeof p.kpis.monthly_burn?.value === "number" ? p.kpis.monthly_burn.value : null,
  }));
  const hasRevenue = chartData.some((d) => d.revenue != null);
  const hasArr = chartData.some((d) => d.arr != null);
  const hasBurn = chartData.some((d) => d.burn != null);
  const showChart = periods.length >= 2 && (hasRevenue || hasArr || hasBurn);
  const money = latest.kpis.revenue?.currency || latest.kpis.arr?.currency || "";

  const cards = CARD_ORDER
    .filter((k) => latest.kpis[k] !== undefined)
    .map((k) => {
      const cur = latest.kpis[k];
      const prv = prev?.kpis[k];
      const d = typeof cur.value === "number" && typeof prv?.value === "number"
        ? delta(cur.value, prv.value) : null;
      return { key: k, cur, prv, d };
    });

  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-1 flex items-center gap-2">
        <BarChart3 className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-sm font-bold uppercase tracking-wider">Performance dashboard</h2>
        <span className="ml-auto text-[10px] font-medium text-muted-foreground">
          As reported for {latest.period}
        </span>
      </div>
      <p className="mb-4 text-[10px] text-muted-foreground">
        All figures verbatim from {data!.company}&apos;s quarterly reports (latest uploaded {latest.uploaded}).
        Hover a metric for its source sentence.
      </p>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {cards.map(({ key, cur, prv, d }) => (
          <div
            key={key}
            title={cur.source_text ?? undefined}
            className="cursor-help rounded-xl border border-border bg-background p-3"
          >
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {cur.label}
            </div>
            <div className="mt-1 font-display text-xl font-bold">
              {typeof cur.value === "number" ? fmtNum(cur.value, cur.currency) : String(cur.value)}
            </div>
            {d && prev && (
              <div className={`mt-0.5 text-[10px] font-medium ${
                d.startsWith("+") ? "text-emerald-600" : "text-red-500"
              }`}>
                {d} vs {prev.period}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Quarterly trend */}
      {showChart && (
        <div className="mt-5">
          <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Quarterly trend {money ? `(${money})` : ""}
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="period" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  axisLine={{ stroke: "var(--border)" }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  tickFormatter={(v: number) => fmtNum(v)}
                  axisLine={false} tickLine={false} width={48} />
                <Tooltip
                  formatter={(v: number, name: string) => [fmtNum(v, money), name]}
                  contentStyle={{
                    borderRadius: 10, border: "1px solid var(--border)",
                    background: "var(--card)", fontSize: 12,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {hasBurn && (
                  <Bar dataKey="burn" name="Monthly burn" fill="var(--muted-foreground)"
                    opacity={0.35} radius={[4, 4, 0, 0]} barSize={22} />
                )}
                {hasRevenue && (
                  <Line dataKey="revenue" name="Revenue" stroke="var(--primary)"
                    strokeWidth={2.5} dot={{ r: 3 }} connectNulls />
                )}
                {hasArr && (
                  <Line dataKey="arr" name="ARR" stroke="var(--muted-foreground)"
                    strokeWidth={2} strokeDasharray="5 4" dot={{ r: 3 }} connectNulls />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {periods.length === 1 && (
        <p className="mt-3 text-[10px] text-muted-foreground">
          Trend chart appears once a second quarterly report is in.
        </p>
      )}
    </section>
  );
}
