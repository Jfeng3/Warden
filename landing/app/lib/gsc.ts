import { google } from "googleapis";

const SITE_URL = "sc-domain:openclaws.blog";

const GSC_SCOPES = [
  "https://www.googleapis.com/auth/webmasters.readonly",
  "https://www.googleapis.com/auth/indexing",
];

function getAuth() {
  const inlineKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!inlineKey) return null;

  // dotenv loads multi-line values with real newlines, which breaks JSON.parse
  // when the private_key PEM has literal \n inside a JSON string.
  let cleaned = "";
  let inString = false;
  for (let i = 0; i < inlineKey.length; i++) {
    const ch = inlineKey[i];
    if (ch === '"' && (i === 0 || inlineKey[i - 1] !== "\\")) {
      inString = !inString;
    }
    if (ch === "\n" && inString) {
      cleaned += "\\n";
    } else {
      cleaned += ch;
    }
  }
  const credentials = JSON.parse(cleaned);
  return new google.auth.GoogleAuth({ credentials, scopes: GSC_SCOPES });
}

function formatDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

function getDateRange(days: number): { startDate: string; endDate: string } {
  const end = new Date();
  end.setDate(end.getDate() - 3);
  const start = new Date(end);
  start.setDate(start.getDate() - days);
  return { startDate: formatDate(start), endDate: formatDate(end) };
}

export interface QueryRow {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface PageRow {
  page: string;
  path: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface SitemapInfo {
  path: string;
  isPending: boolean;
  lastDownloaded: string | null;
}

export interface GscData {
  queries: QueryRow[];
  pages: PageRow[];
  sitemaps: SitemapInfo[];
  dateRange: { startDate: string; endDate: string };
  totalClicks: number;
  totalImpressions: number;
  avgCtr: number;
  avgPosition: number;
  hasCredentials: boolean;
  error?: string;
}

export async function fetchGscData(days = 7, limit = 20): Promise<GscData> {
  const empty: GscData = {
    queries: [],
    pages: [],
    sitemaps: [],
    dateRange: getDateRange(days),
    totalClicks: 0,
    totalImpressions: 0,
    avgCtr: 0,
    avgPosition: 0,
    hasCredentials: false,
  };

  const auth = getAuth();
  if (!auth) {
    return { ...empty, error: "No GSC credentials configured" };
  }

  empty.hasCredentials = true;

  try {
    const webmasters = google.webmasters({ version: "v3", auth });
    const { startDate, endDate } = getDateRange(days);

    const [queriesRes, pagesRes, sitemapsRes] = await Promise.all([
      webmasters.searchanalytics.query({
        siteUrl: SITE_URL,
        requestBody: { startDate, endDate, dimensions: ["query"], rowLimit: limit },
      }),
      webmasters.searchanalytics.query({
        siteUrl: SITE_URL,
        requestBody: { startDate, endDate, dimensions: ["page"], rowLimit: limit },
      }),
      webmasters.sitemaps.list({ siteUrl: SITE_URL }),
    ]);

    const queryRows: QueryRow[] = (queriesRes.data.rows ?? []).map((r: any) => ({
      query: r.keys?.[0] ?? "",
      clicks: Math.round(r.clicks ?? 0),
      impressions: Math.round(r.impressions ?? 0),
      ctr: r.ctr ?? 0,
      position: r.position ?? 0,
    }));

    const pageRows: PageRow[] = (pagesRes.data.rows ?? []).map((r: any) => {
      const fullUrl = r.keys?.[0] ?? "";
      let path: string;
      try {
        path = new URL(fullUrl).pathname;
      } catch {
        path = fullUrl;
      }
      return {
        page: fullUrl,
        path,
        clicks: Math.round(r.clicks ?? 0),
        impressions: Math.round(r.impressions ?? 0),
        ctr: r.ctr ?? 0,
        position: r.position ?? 0,
      };
    });

    const sitemaps: SitemapInfo[] = (sitemapsRes.data.sitemap ?? []).map((s) => ({
      path: s.path ?? "",
      isPending: !!s.isPending,
      lastDownloaded: s.lastDownloaded ?? null,
    }));

    const totalClicks = queryRows.reduce((s, r) => s + r.clicks, 0);
    const totalImpressions = queryRows.reduce((s, r) => s + r.impressions, 0);
    const avgCtr = totalImpressions > 0 ? totalClicks / totalImpressions : 0;
    const avgPosition =
      queryRows.length > 0
        ? queryRows.reduce((s, r) => s + r.position, 0) / queryRows.length
        : 0;

    return {
      queries: queryRows,
      pages: pageRows,
      sitemaps,
      dateRange: { startDate, endDate },
      totalClicks,
      totalImpressions,
      avgCtr,
      avgPosition,
      hasCredentials: true,
    };
  } catch (err: any) {
    return { ...empty, error: err.message || String(err) };
  }
}
