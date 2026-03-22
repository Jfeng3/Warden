import { fetchGscData } from "../../lib/gsc";
import type { QueryRow, PageRow } from "../../lib/gsc";

export const dynamic = "force-dynamic";

/* ── Metric Card ─────────────────────────────────────────── */
function MetricCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-border px-5 py-5">
      <p className="text-xs uppercase tracking-wide text-text-ghost">
        {label}
      </p>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-text-primary">
        {value}
      </p>
      {sub && (
        <p className="mt-1 text-xs text-text-tertiary">{sub}</p>
      )}
    </div>
  );
}

/* ── Horizontal Bar ──────────────────────────────────────── */
function HBar({
  value,
  max,
  color = "default",
}: {
  value: number;
  max: number;
  color?: "default" | "accent";
}) {
  const pct = max > 0 ? Math.max((value / max) * 100, 1) : 0;
  const bg = color === "accent" ? "bg-accent" : "bg-text-tertiary";
  return (
    <div className="h-[6px] w-full rounded-full bg-raised">
      <div
        className={`h-full rounded-full ${bg} transition-all duration-700 ease-out`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

/* ── Position Indicator ──────────────────────────────────── */
function PositionDot({ position }: { position: number }) {
  let color = "bg-red-400";
  if (position <= 3) color = "bg-green";
  else if (position <= 10) color = "bg-amber-400";
  else if (position <= 20) color = "bg-orange-400";
  return (
    <span className={`inline-block h-2 w-2 rounded-full ${color}`} />
  );
}

/* ── Position Scale ──────────────────────────────────────── */
function PositionScale({ position }: { position: number }) {
  const clamped = Math.min(Math.max(position, 1), 100);
  const pct = ((clamped - 1) / 99) * 100;
  let markerColor = "bg-red-400";
  if (position <= 3) markerColor = "bg-green";
  else if (position <= 10) markerColor = "bg-amber-400";
  else if (position <= 20) markerColor = "bg-orange-400";

  return (
    <div className="relative h-[3px] w-full max-w-[80px] rounded-full bg-raised">
      <div className="absolute left-0 top-0 h-full w-[10%] rounded-l-full bg-green/15" />
      <div className="absolute left-[10%] top-0 h-full w-[20%] bg-amber-400/10" />
      <div
        className={`absolute top-1/2 h-[7px] w-[7px] -translate-y-1/2 rounded-full ${markerColor} transition-all duration-500`}
        style={{ left: `calc(${pct}% - 3.5px)` }}
      />
    </div>
  );
}

/* ── CTR Gauge ────────────────────────────────────────── */
function CtrGauge({ ctr }: { ctr: number }) {
  const pct = ctr * 100;
  const color =
    pct >= 5
      ? "text-green"
      : pct >= 3
        ? "text-amber-500"
        : pct >= 1
          ? "text-orange-500"
          : "text-text-ghost";
  return (
    <span className={`font-mono text-xs tabular-nums ${color}`}>
      {pct.toFixed(1)}%
    </span>
  );
}

/* ── Query Distribution Chart ────────────────────────────── */
function PositionDistribution({ queries }: { queries: QueryRow[] }) {
  if (queries.length === 0) return null;
  const buckets = [
    { label: "Top 3", range: [1, 3], color: "bg-green" },
    { label: "4-10", range: [4, 10], color: "bg-amber-400" },
    { label: "11-20", range: [11, 20], color: "bg-orange-400" },
    { label: "20+", range: [21, Infinity], color: "bg-red-400/70" },
  ];

  const counts = buckets.map((b) =>
    queries.filter((q) => q.position >= b.range[0] && q.position <= b.range[1]).length
  );
  const total = queries.length;

  return (
    <div className="space-y-3">
      {buckets.map((b, i) => (
        <div key={b.label} className="flex items-center gap-3">
          <span className="w-12 text-xs text-text-ghost text-right">
            {b.label}
          </span>
          <div className="flex-1 h-[10px] rounded-full bg-raised overflow-hidden">
            <div
              className={`h-full rounded-full ${b.color} transition-all duration-700`}
              style={{
                width: total > 0 ? `${Math.max((counts[i] / total) * 100, counts[i] > 0 ? 4 : 0)}%` : "0%",
              }}
            />
          </div>
          <span className="w-6 font-mono text-xs text-text-tertiary text-right tabular-nums">
            {counts[i]}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ── Opportunity List ─────────────────────────────────── */
function OpportunityList({ queries }: { queries: QueryRow[] }) {
  const opportunities = queries
    .filter((q) => q.impressions > 5 && q.ctr < 0.04 && q.position <= 20)
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, 5);

  if (opportunities.length === 0) {
    return (
      <p className="py-6 text-center text-xs text-text-ghost">
        No optimization opportunities detected yet
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {opportunities.map((q) => (
        <div
          key={q.query}
          className="group flex items-center gap-3 rounded-lg border border-border px-3 py-2.5 hover:border-border-hover transition-colors"
        >
          <div className="flex-1 min-w-0">
            <p className="text-sm text-text-primary truncate">{q.query}</p>
            <div className="mt-1 flex items-center gap-3">
              <span className="text-[10px] text-text-ghost">
                pos {q.position.toFixed(1)}
              </span>
              <span className="text-[10px] text-text-ghost">
                {q.impressions} impr
              </span>
              <span className="text-[10px] text-orange-500">
                {(q.ctr * 100).toFixed(1)}% CTR
              </span>
            </div>
          </div>
          <div className="shrink-0">
            <span className="text-[10px] uppercase tracking-wide text-text-ghost group-hover:text-text-tertiary transition-colors">
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
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-border bg-surface">
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-text-ghost"
        >
          <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          <path d="M10 7v6m-3-3h6" strokeOpacity="0.5" />
        </svg>
      </div>
      {!hasCredentials ? (
        <>
          <h3 className="text-xl font-semibold text-text-primary">
            Connect Google Search Console
          </h3>
          <p className="mt-2 max-w-md text-sm text-text-tertiary">
            Set <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-xs text-text-primary">GOOGLE_SERVICE_ACCOUNT_KEY</code>{" "}
            in your environment to enable SEO analytics.
          </p>
        </>
      ) : (
        <>
          <h3 className="text-xl font-semibold text-text-primary">
            Waiting for search data
          </h3>
          <p className="mt-2 max-w-md text-sm text-text-tertiary">
            Google hasn&apos;t collected enough data yet. This is normal for new sites &mdash;
            check back in a few days.
          </p>
          {error && (
            <p className="mt-3 max-w-md font-mono text-xs text-red-500">
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
          <h1 className="text-2xl font-semibold text-text-primary">
            SEO Performance
          </h1>
          <span className="rounded-full border border-border px-2.5 py-0.5 text-[10px] uppercase tracking-wide text-text-ghost">
            via GSC
          </span>
        </div>
        <p className="mt-1 text-sm text-text-tertiary">
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
            />
            <MetricCard
              label="Impressions"
              value={data.totalImpressions.toLocaleString()}
              sub="search appearances"
            />
            <MetricCard
              label="Avg CTR"
              value={`${(data.avgCtr * 100).toFixed(1)}%`}
              sub={data.avgCtr >= 0.05 ? "above average" : data.avgCtr >= 0.03 ? "average" : "needs work"}
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
            />
          </div>

          {/* ── Main Grid ── */}
          <div className="grid grid-cols-5 gap-6">
            {/* ── Top Queries (3 cols) ── */}
            <div className="col-span-3">
              <h2 className="mb-3 text-xs uppercase tracking-wide text-text-ghost">
                Top Search Queries
              </h2>
              <div className="rounded-xl border border-border overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border text-left text-[10px] uppercase tracking-wide text-text-ghost">
                      <th className="px-4 py-3 font-medium">Query</th>
                      <th className="px-4 py-3 w-28 font-medium">Clicks</th>
                      <th className="px-4 py-3 w-28 font-medium">Impressions</th>
                      <th className="px-4 py-3 w-16 text-right font-medium">CTR</th>
                      <th className="px-4 py-3 w-24 text-right font-medium">Position</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.queries.slice(0, 10).map((q) => (
                      <tr
                        key={q.query}
                        className="border-b border-border last:border-0 hover:bg-surface transition-colors"
                      >
                        <td className="px-4 py-2.5">
                          <span className="text-sm text-text-primary">{q.query}</span>
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <span className="w-8 font-mono text-xs text-text-primary tabular-nums text-right">
                              {q.clicks}
                            </span>
                            <HBar value={q.clicks} max={maxClicks} color="accent" />
                          </div>
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <span className="w-8 font-mono text-xs text-text-tertiary tabular-nums text-right">
                              {q.impressions}
                            </span>
                            <HBar value={q.impressions} max={maxImpressions} />
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
                              <span className="w-6 font-mono text-xs text-text-tertiary tabular-nums">
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
                <h2 className="mb-3 text-xs uppercase tracking-wide text-text-ghost">
                  Position Distribution
                </h2>
                <div className="rounded-xl border border-border px-5 py-4">
                  <PositionDistribution queries={data.queries} />
                </div>
              </div>

              {/* Opportunities */}
              <div>
                <h2 className="mb-3 text-xs uppercase tracking-wide text-text-ghost">
                  Optimization Opportunities
                </h2>
                <div className="rounded-xl border border-border px-4 py-3">
                  <OpportunityList queries={data.queries} />
                  <p className="mt-2 border-t border-border pt-2 text-[10px] text-text-ghost">
                    High impressions + low CTR = improve title &amp; meta description
                  </p>
                </div>
              </div>

              {/* Sitemaps */}
              <div>
                <h2 className="mb-3 text-xs uppercase tracking-wide text-text-ghost">
                  Sitemaps
                </h2>
                <div className="rounded-xl border border-border">
                  {data.sitemaps.length === 0 ? (
                    <p className="px-5 py-4 text-xs text-text-ghost">
                      No sitemaps submitted
                    </p>
                  ) : (
                    data.sitemaps.map((s) => (
                      <div
                        key={s.path}
                        className="flex items-center justify-between border-b border-border last:border-0 px-4 py-3"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div
                            className={`h-2 w-2 rounded-full ${
                              s.isPending ? "bg-amber-400" : "bg-green"
                            }`}
                          />
                          <span className="font-mono text-xs text-text-primary truncate">
                            {s.path.replace("https://openclaws.blog/", "/")}
                          </span>
                        </div>
                        <span className="shrink-0 text-[10px] text-text-ghost">
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
            <h2 className="mb-3 text-xs uppercase tracking-wide text-text-ghost">
              Top Pages
            </h2>
            <div className="rounded-xl border border-border overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border text-left text-[10px] uppercase tracking-wide text-text-ghost">
                    <th className="px-4 py-3 font-medium">Page</th>
                    <th className="px-4 py-3 w-36 font-medium">Clicks</th>
                    <th className="px-4 py-3 w-36 font-medium">Impressions</th>
                    <th className="px-4 py-3 w-16 text-right font-medium">CTR</th>
                    <th className="px-4 py-3 w-20 text-right font-medium">Position</th>
                  </tr>
                </thead>
                <tbody>
                  {data.pages.map((p) => (
                    <tr
                      key={p.page}
                      className="border-b border-border last:border-0 hover:bg-surface transition-colors"
                    >
                      <td className="px-4 py-2.5">
                        <span className="font-mono text-sm text-text-primary">
                          {p.path}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <span className="w-8 font-mono text-xs text-text-primary tabular-nums text-right">
                            {p.clicks}
                          </span>
                          <HBar value={p.clicks} max={maxPageClicks} color="accent" />
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <span className="w-8 font-mono text-xs text-text-tertiary tabular-nums text-right">
                            {p.impressions}
                          </span>
                          <HBar
                            value={p.impressions}
                            max={Math.max(...data.pages.map((x) => x.impressions), 1)}
                          />
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <CtrGauge ctr={p.ctr} />
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <PositionDot position={p.position} />
                          <span className="font-mono text-xs text-text-tertiary tabular-nums">
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
