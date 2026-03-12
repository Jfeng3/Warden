import { fetchGscData } from "../../lib/gsc";
import type { QueryRow, PageRow } from "../../lib/gsc";

export const dynamic = "force-dynamic";

/* ── Metric Card ─────────────────────────────────────────── */
function MetricCard({
  label,
  value,
  sub,
  accent = "phosphor",
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: "phosphor" | "cyan" | "emerald" | "red";
}) {
  const glowMap = {
    phosphor: "shadow-[0_0_20px_rgba(240,160,48,0.08)]",
    cyan: "shadow-[0_0_20px_rgba(34,211,238,0.08)]",
    emerald: "shadow-[0_0_20px_rgba(52,211,153,0.08)]",
    red: "shadow-[0_0_20px_rgba(239,68,68,0.06)]",
  };
  const accentColor = {
    phosphor: "text-phosphor",
    cyan: "text-cyan-bright",
    emerald: "text-emerald-400",
    red: "text-red-400",
  };
  return (
    <div
      className={`relative overflow-hidden rounded-lg border border-border-subtle bg-onyx/50 px-5 py-5 ${glowMap[accent]}`}
    >
      {/* Top accent line */}
      <div
        className={`absolute inset-x-0 top-0 h-[1px] ${
          accent === "phosphor"
            ? "bg-gradient-to-r from-transparent via-phosphor/50 to-transparent"
            : accent === "cyan"
              ? "bg-gradient-to-r from-transparent via-cyan-bright/50 to-transparent"
              : accent === "emerald"
                ? "bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent"
                : "bg-gradient-to-r from-transparent via-red-400/50 to-transparent"
        }`}
      />
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-text-tertiary">
        {label}
      </p>
      <p className={`mt-2 font-mono text-3xl font-light tracking-tight ${accentColor[accent]}`}>
        {value}
      </p>
      {sub && (
        <p className="mt-1 font-mono text-[11px] text-text-secondary">{sub}</p>
      )}
    </div>
  );
}

/* ── Horizontal Bar ──────────────────────────────────────── */
function HBar({
  value,
  max,
  color = "phosphor",
}: {
  value: number;
  max: number;
  color?: "phosphor" | "cyan";
}) {
  const pct = max > 0 ? Math.max((value / max) * 100, 1) : 0;
  const bg = color === "phosphor" ? "bg-phosphor/70" : "bg-cyan-bright/70";
  const glow =
    color === "phosphor"
      ? "shadow-[0_0_6px_rgba(240,160,48,0.3)]"
      : "shadow-[0_0_6px_rgba(34,211,238,0.3)]";
  return (
    <div className="h-[6px] w-full rounded-full bg-graphite/80">
      <div
        className={`h-full rounded-full ${bg} ${glow} transition-all duration-700 ease-out`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

/* ── Position Indicator ──────────────────────────────────── */
function PositionDot({ position }: { position: number }) {
  // Color based on position: 1-3 green, 4-10 amber, 11-20 orange, 20+ red
  let color = "bg-red-400/80";
  let ring = "ring-red-400/20";
  if (position <= 3) {
    color = "bg-emerald-400";
    ring = "ring-emerald-400/30";
  } else if (position <= 10) {
    color = "bg-phosphor";
    ring = "ring-phosphor/20";
  } else if (position <= 20) {
    color = "bg-orange-400/80";
    ring = "ring-orange-400/20";
  }
  return (
    <span className={`inline-block h-2 w-2 rounded-full ${color} ring-2 ${ring}`} />
  );
}

/* ── Position Scale ──────────────────────────────────────── */
function PositionScale({ position }: { position: number }) {
  // Visual scale: 1 is best (left), 100 is worst (right)
  const clamped = Math.min(Math.max(position, 1), 100);
  const pct = ((clamped - 1) / 99) * 100;
  let markerColor = "bg-red-400";
  if (position <= 3) markerColor = "bg-emerald-400";
  else if (position <= 10) markerColor = "bg-phosphor";
  else if (position <= 20) markerColor = "bg-orange-400";

  return (
    <div className="relative h-[3px] w-full max-w-[80px] rounded-full bg-graphite">
      {/* Zone markers */}
      <div className="absolute left-0 top-0 h-full w-[10%] rounded-l-full bg-emerald-500/15" />
      <div className="absolute left-[10%] top-0 h-full w-[20%] bg-phosphor/10" />
      {/* Position marker */}
      <div
        className={`absolute top-1/2 h-[7px] w-[7px] -translate-y-1/2 rounded-full ${markerColor} transition-all duration-500`}
        style={{ left: `calc(${pct}% - 3.5px)` }}
      />
    </div>
  );
}

/* ── CTR Gauge (mini arc) ────────────────────────────────── */
function CtrGauge({ ctr }: { ctr: number }) {
  const pct = Math.min(ctr * 100, 15); // cap at 15% for visual
  const normalized = (pct / 15) * 100; // normalize to 0-100 for display
  const color =
    pct >= 5
      ? "text-emerald-400"
      : pct >= 3
        ? "text-phosphor"
        : pct >= 1
          ? "text-orange-400"
          : "text-text-tertiary";
  return (
    <span className={`font-mono text-xs tabular-nums ${color}`}>
      {(ctr * 100).toFixed(1)}%
    </span>
  );
}

/* ── Query Distribution Chart ────────────────────────────── */
function PositionDistribution({ queries }: { queries: QueryRow[] }) {
  if (queries.length === 0) return null;
  const buckets = [
    { label: "Top 3", range: [1, 3], color: "bg-emerald-400", glow: "shadow-[0_0_8px_rgba(52,211,153,0.25)]" },
    { label: "4–10", range: [4, 10], color: "bg-phosphor", glow: "shadow-[0_0_8px_rgba(240,160,48,0.25)]" },
    { label: "11–20", range: [11, 20], color: "bg-orange-400", glow: "shadow-[0_0_8px_rgba(251,146,60,0.2)]" },
    { label: "20+", range: [21, Infinity], color: "bg-red-400/70", glow: "" },
  ];

  const counts = buckets.map((b) =>
    queries.filter((q) => q.position >= b.range[0] && q.position <= b.range[1]).length
  );
  const total = queries.length;

  return (
    <div className="space-y-3">
      {buckets.map((b, i) => (
        <div key={b.label} className="flex items-center gap-3">
          <span className="w-12 font-mono text-[11px] text-text-tertiary text-right">
            {b.label}
          </span>
          <div className="flex-1 h-[10px] rounded-full bg-graphite/80 overflow-hidden">
            <div
              className={`h-full rounded-full ${b.color} ${b.glow} transition-all duration-700`}
              style={{
                width: total > 0 ? `${Math.max((counts[i] / total) * 100, counts[i] > 0 ? 4 : 0)}%` : "0%",
              }}
            />
          </div>
          <span className="w-6 font-mono text-xs text-text-secondary text-right tabular-nums">
            {counts[i]}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ── Impression vs Click Scatter ─────────────────────────── */
function OpportunityList({ queries }: { queries: QueryRow[] }) {
  // High impressions + low CTR = optimization opportunities
  const opportunities = queries
    .filter((q) => q.impressions > 5 && q.ctr < 0.04 && q.position <= 20)
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, 5);

  if (opportunities.length === 0) {
    return (
      <p className="py-6 text-center font-mono text-xs text-text-tertiary">
        No optimization opportunities detected yet
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {opportunities.map((q) => (
        <div
          key={q.query}
          className="group flex items-center gap-3 rounded-md border border-border-subtle/50 bg-graphite/30 px-3 py-2.5 hover:border-phosphor/20 transition-colors"
        >
          <div className="flex-1 min-w-0">
            <p className="text-sm text-text-primary truncate">{q.query}</p>
            <div className="mt-1 flex items-center gap-3">
              <span className="font-mono text-[10px] text-text-tertiary">
                pos {q.position.toFixed(1)}
              </span>
              <span className="font-mono text-[10px] text-text-tertiary">
                {q.impressions} impr
              </span>
              <span className="font-mono text-[10px] text-orange-400">
                {(q.ctr * 100).toFixed(1)}% CTR
              </span>
            </div>
          </div>
          <div className="shrink-0">
            <span className="font-mono text-[10px] uppercase tracking-widest text-phosphor/60 group-hover:text-phosphor transition-colors">
              optimize
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Empty State ─────────────────────────────────────────── */
function EmptyState({ hasCredentials, error }: { hasCredentials: boolean; error?: string }) {
  return (
    <div className="mt-12 flex flex-col items-center text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-border-subtle bg-onyx/50">
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-text-tertiary"
        >
          <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          <path d="M10 7v6m-3-3h6" strokeOpacity="0.5" />
        </svg>
      </div>
      {!hasCredentials ? (
        <>
          <h3 className="font-display text-xl italic text-text-primary">
            Connect Google Search Console
          </h3>
          <p className="mt-2 max-w-md text-sm text-text-secondary">
            Set <code className="rounded bg-graphite px-1.5 py-0.5 font-mono text-xs text-phosphor">GOOGLE_SERVICE_ACCOUNT_KEY</code>{" "}
            in your environment to enable SEO analytics.
          </p>
        </>
      ) : (
        <>
          <h3 className="font-display text-xl italic text-text-primary">
            Waiting for search data
          </h3>
          <p className="mt-2 max-w-md text-sm text-text-secondary">
            Google hasn&apos;t collected enough data yet. This is normal for new sites &mdash;
            check back in a few days.
          </p>
          {error && (
            <p className="mt-3 max-w-md font-mono text-xs text-red-400/80">
              {error}
            </p>
          )}
        </>
      )}
    </div>
  );
}

/* ── Page Component ──────────────────────────────────────── */
export default async function SeoDashboard() {
  const data = await fetchGscData(7, 20);
  const hasData = data.queries.length > 0 || data.pages.length > 0;

  const maxClicks = Math.max(...(data.queries.map((q) => q.clicks)), 1);
  const maxImpressions = Math.max(...(data.queries.map((q) => q.impressions)), 1);
  const maxPageClicks = Math.max(...(data.pages.map((p) => p.clicks)), 1);

  return (
    <>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <h1 className="font-display text-3xl italic text-text-primary">
            SEO Performance
          </h1>
          <span className="rounded-full border border-border-subtle bg-graphite/50 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-widest text-text-tertiary">
            via GSC
          </span>
        </div>
        <p className="mt-1 text-sm text-text-secondary">
          {hasData ? (
            <>
              Search analytics for{" "}
              <span className="font-mono text-text-primary">
                {data.dateRange.startDate}
              </span>{" "}
              to{" "}
              <span className="font-mono text-text-primary">
                {data.dateRange.endDate}
              </span>
            </>
          ) : (
            "Google Search Console integration"
          )}
        </p>
      </div>

      {!hasData ? (
        <EmptyState hasCredentials={data.hasCredentials} error={data.error} />
      ) : (
        <>
          {/* ── Metric Cards ── */}
          <div className="mb-8 grid grid-cols-4 gap-4">
            <MetricCard
              label="Total Clicks"
              value={data.totalClicks.toLocaleString()}
              sub={`${data.queries.length} queries`}
              accent="cyan"
            />
            <MetricCard
              label="Impressions"
              value={data.totalImpressions.toLocaleString()}
              sub="search appearances"
              accent="phosphor"
            />
            <MetricCard
              label="Avg CTR"
              value={`${(data.avgCtr * 100).toFixed(1)}%`}
              sub={data.avgCtr >= 0.05 ? "above average" : data.avgCtr >= 0.03 ? "average" : "needs work"}
              accent={data.avgCtr >= 0.05 ? "emerald" : data.avgCtr >= 0.03 ? "phosphor" : "red"}
            />
            <MetricCard
              label="Avg Position"
              value={data.avgPosition.toFixed(1)}
              sub={
                data.avgPosition <= 10
                  ? "page 1 average"
                  : data.avgPosition <= 20
                    ? "page 2 average"
                    : "page 3+ average"
              }
              accent={data.avgPosition <= 10 ? "emerald" : data.avgPosition <= 20 ? "phosphor" : "red"}
            />
          </div>

          {/* ── Main Grid ── */}
          <div className="grid grid-cols-5 gap-6">
            {/* ── Top Queries (3 cols) ── */}
            <div className="col-span-3">
              <h2 className="mb-3 font-mono text-xs uppercase tracking-widest text-text-tertiary">
                Top Search Queries
              </h2>
              <div className="rounded-lg border border-border-subtle bg-onyx/30 overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border-subtle text-left font-mono text-[10px] uppercase tracking-wider text-text-tertiary">
                      <th className="px-4 py-3">Query</th>
                      <th className="px-4 py-3 w-28">Clicks</th>
                      <th className="px-4 py-3 w-28">Impressions</th>
                      <th className="px-4 py-3 w-16 text-right">CTR</th>
                      <th className="px-4 py-3 w-24 text-right">Position</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.queries.slice(0, 10).map((q, i) => (
                      <tr
                        key={q.query}
                        className="border-b border-border-subtle/30 last:border-0 hover:bg-graphite/30 transition-colors"
                      >
                        <td className="px-4 py-2.5">
                          <span className="text-sm text-text-primary">{q.query}</span>
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <span className="w-8 font-mono text-xs text-cyan-bright tabular-nums text-right">
                              {q.clicks}
                            </span>
                            <HBar value={q.clicks} max={maxClicks} color="cyan" />
                          </div>
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <span className="w-8 font-mono text-xs text-text-secondary tabular-nums text-right">
                              {q.impressions}
                            </span>
                            <HBar
                              value={q.impressions}
                              max={maxImpressions}
                              color="phosphor"
                            />
                          </div>
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <CtrGauge ctr={q.ctr} />
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center justify-end gap-2">
                            <PositionScale position={q.position} />
                            <div className="flex items-center gap-1.5">
                              <PositionDot position={q.position} />
                              <span className="w-6 font-mono text-xs text-text-secondary tabular-nums">
                                {q.position.toFixed(0)}
                              </span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── Right Column (2 cols) ── */}
            <div className="col-span-2 space-y-6">
              {/* Position Distribution */}
              <div>
                <h2 className="mb-3 font-mono text-xs uppercase tracking-widest text-text-tertiary">
                  Position Distribution
                </h2>
                <div className="rounded-lg border border-border-subtle bg-onyx/30 px-5 py-4">
                  <PositionDistribution queries={data.queries} />
                </div>
              </div>

              {/* Opportunities */}
              <div>
                <h2 className="mb-3 font-mono text-xs uppercase tracking-widest text-text-tertiary">
                  Optimization Opportunities
                </h2>
                <div className="rounded-lg border border-border-subtle bg-onyx/30 px-4 py-3">
                  <OpportunityList queries={data.queries} />
                  <p className="mt-2 border-t border-border-subtle/50 pt-2 font-mono text-[10px] text-text-tertiary">
                    High impressions + low CTR = improve title &amp; meta description
                  </p>
                </div>
              </div>

              {/* Sitemaps */}
              <div>
                <h2 className="mb-3 font-mono text-xs uppercase tracking-widest text-text-tertiary">
                  Sitemaps
                </h2>
                <div className="rounded-lg border border-border-subtle bg-onyx/30">
                  {data.sitemaps.length === 0 ? (
                    <p className="px-5 py-4 font-mono text-xs text-text-tertiary">
                      No sitemaps submitted
                    </p>
                  ) : (
                    data.sitemaps.map((s) => (
                      <div
                        key={s.path}
                        className="flex items-center justify-between border-b border-border-subtle/30 last:border-0 px-4 py-3"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div
                            className={`h-2 w-2 rounded-full ${
                              s.isPending ? "bg-yellow-400 glow-pulse" : "bg-emerald-400"
                            }`}
                          />
                          <span className="font-mono text-xs text-text-primary truncate">
                            {s.path.replace("https://openclaws.blog/", "/")}
                          </span>
                        </div>
                        <span className="shrink-0 font-mono text-[10px] text-text-tertiary">
                          {s.isPending
                            ? "pending"
                            : s.lastDownloaded
                              ? `crawled ${new Date(s.lastDownloaded).toLocaleDateString()}`
                              : "—"}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ── Top Pages ── */}
          <div className="mt-8">
            <h2 className="mb-3 font-mono text-xs uppercase tracking-widest text-text-tertiary">
              Top Pages
            </h2>
            <div className="rounded-lg border border-border-subtle bg-onyx/30 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border-subtle text-left font-mono text-[10px] uppercase tracking-wider text-text-tertiary">
                    <th className="px-4 py-3">Page</th>
                    <th className="px-4 py-3 w-36">Clicks</th>
                    <th className="px-4 py-3 w-36">Impressions</th>
                    <th className="px-4 py-3 w-16 text-right">CTR</th>
                    <th className="px-4 py-3 w-20 text-right">Position</th>
                  </tr>
                </thead>
                <tbody>
                  {data.pages.map((p) => (
                    <tr
                      key={p.page}
                      className="border-b border-border-subtle/30 last:border-0 hover:bg-graphite/30 transition-colors"
                    >
                      <td className="px-4 py-2.5">
                        <span className="font-mono text-sm text-cyan-bright">
                          {p.path}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <span className="w-8 font-mono text-xs text-text-primary tabular-nums text-right">
                            {p.clicks}
                          </span>
                          <HBar value={p.clicks} max={maxPageClicks} color="cyan" />
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <span className="w-8 font-mono text-xs text-text-secondary tabular-nums text-right">
                            {p.impressions}
                          </span>
                          <HBar
                            value={p.impressions}
                            max={Math.max(...data.pages.map((x) => x.impressions), 1)}
                            color="phosphor"
                          />
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <CtrGauge ctr={p.ctr} />
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <PositionDot position={p.position} />
                          <span className="font-mono text-xs text-text-secondary tabular-nums">
                            {p.position.toFixed(1)}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </>
  );
}
