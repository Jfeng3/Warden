import { Type } from "@sinclair/typebox";
import type { ToolDefinition } from "@mariozechner/pi-coding-agent";
import { google } from "googleapis";
import os from "node:os";

const SITE_URL = "sc-domain:openclaws.blog";

const GscParams = Type.Object({
  action: Type.String({
    description:
      'Action to perform. One of: "topQueries" (top search queries by clicks), "topPages" (top pages by clicks), "indexStatus" (inspect a specific URL), "sitemaps" (list submitted sitemaps)',
  }),
  days: Type.Optional(
    Type.Number({ description: "Lookback period in days (default: 7, max: 28)" })
  ),
  limit: Type.Optional(
    Type.Number({ description: "Max rows to return (default: 10, max: 25)" })
  ),
  url: Type.Optional(
    Type.String({ description: "URL to inspect (required for indexStatus action)" })
  ),
});

const GSC_SCOPES = [
  "https://www.googleapis.com/auth/webmasters.readonly",
  "https://www.googleapis.com/auth/indexing",
];

function getAuth() {
  // Option 1: inline JSON content in env var
  const inlineKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (inlineKey) {
    // dotenv loads multi-line values with real newlines, which breaks JSON.parse
    // when the private_key PEM has literal \n inside a JSON string.
    // Fix: parse line-by-line, re-escaping newlines inside JSON string values.
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

  // Option 2: file path to JSON key
  const rawPath = process.env.GSC_KEY_PATH;
  if (rawPath) {
    const keyPath = rawPath.replace(/^~/, os.homedir());
    return new google.auth.GoogleAuth({ keyFile: keyPath, scopes: GSC_SCOPES });
  }

  throw new Error(
    "No GSC credentials found. Set either GOOGLE_SERVICE_ACCOUNT_KEY (inline JSON) or GSC_KEY_PATH (path to key file)."
  );
}

function formatDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

function getDateRange(days: number): { startDate: string; endDate: string } {
  const end = new Date();
  end.setDate(end.getDate() - 3); // GSC data lags ~3 days
  const start = new Date(end);
  start.setDate(start.getDate() - days);
  return { startDate: formatDate(start), endDate: formatDate(end) };
}

async function topQueries(days: number, limit: number): Promise<string> {
  const auth = getAuth();
  const webmasters = google.webmasters({ version: "v3", auth });
  const { startDate, endDate } = getDateRange(days);

  const res = await webmasters.searchanalytics.query({
    siteUrl: SITE_URL,
    requestBody: {
      startDate,
      endDate,
      dimensions: ["query"],
      rowLimit: limit,
    },
  });

  const rows = res.data.rows;
  if (!rows || rows.length === 0) {
    return `No query data found for ${startDate} to ${endDate}.`;
  }

  const header = ` #  Query                              Clicks  Impr    CTR     Pos`;
  const divider = `───────────────────────────────────────────────────────────────────`;
  const lines = rows.map((r: any, i: number) => {
    const query = (r.keys?.[0] ?? "").padEnd(35).slice(0, 35);
    const clicks = String(Math.round(r.clicks ?? 0)).padStart(6);
    const impressions = String(Math.round(r.impressions ?? 0)).padStart(6);
    const ctr = ((r.ctr ?? 0) * 100).toFixed(1).padStart(6) + "%";
    const pos = (r.position ?? 0).toFixed(1).padStart(6);
    return `${String(i + 1).padStart(2)}  ${query} ${clicks} ${impressions} ${ctr} ${pos}`;
  });

  return `TOP QUERIES (${startDate} to ${endDate})\n${divider}\n${header}\n${divider}\n${lines.join("\n")}`;
}

async function topPages(days: number, limit: number): Promise<string> {
  const auth = getAuth();
  const webmasters = google.webmasters({ version: "v3", auth });
  const { startDate, endDate } = getDateRange(days);

  const res = await webmasters.searchanalytics.query({
    siteUrl: SITE_URL,
    requestBody: {
      startDate,
      endDate,
      dimensions: ["page"],
      rowLimit: limit,
    },
  });

  const rows = res.data.rows;
  if (!rows || rows.length === 0) {
    return `No page data found for ${startDate} to ${endDate}.`;
  }

  const header = ` #  Page                                         Clicks  Impr    CTR     Pos`;
  const divider = `────────────────────────────────────────────────────────────────────────────`;
  const lines = rows.map((r: any, i: number) => {
    const fullUrl = r.keys?.[0] ?? "";
    // Show just the path for readability
    let page: string;
    try {
      page = new URL(fullUrl).pathname;
    } catch {
      page = fullUrl;
    }
    page = page.padEnd(45).slice(0, 45);
    const clicks = String(Math.round(r.clicks ?? 0)).padStart(6);
    const impressions = String(Math.round(r.impressions ?? 0)).padStart(6);
    const ctr = ((r.ctr ?? 0) * 100).toFixed(1).padStart(6) + "%";
    const pos = (r.position ?? 0).toFixed(1).padStart(6);
    return `${String(i + 1).padStart(2)}  ${page} ${clicks} ${impressions} ${ctr} ${pos}`;
  });

  return `TOP PAGES (${startDate} to ${endDate})\n${divider}\n${header}\n${divider}\n${lines.join("\n")}`;
}

async function indexStatus(url: string): Promise<string> {
  const auth = getAuth();
  const searchconsole = google.searchconsole({ version: "v1", auth });

  const res = await searchconsole.urlInspection.index.inspect({
    requestBody: {
      inspectionUrl: url,
      siteUrl: SITE_URL,
    },
  });

  const result = res.data.inspectionResult;
  if (!result) {
    return `No inspection data returned for ${url}.`;
  }

  const indexResult = result.indexStatusResult;
  const lines = [
    `URL INSPECTION: ${url}`,
    `───────────────────────────────────────────`,
    `Coverage state:  ${indexResult?.coverageState ?? "unknown"}`,
    `Indexing state:  ${indexResult?.indexingState ?? "unknown"}`,
    `Last crawl time: ${indexResult?.lastCrawlTime ?? "never"}`,
    `Page fetch state: ${indexResult?.pageFetchState ?? "unknown"}`,
    `Robots.txt state: ${indexResult?.robotsTxtState ?? "unknown"}`,
  ];

  if (indexResult?.referringUrls && indexResult.referringUrls.length > 0) {
    lines.push(`Referring URLs:  ${indexResult.referringUrls.join(", ")}`);
  }

  return lines.join("\n");
}

async function listSitemaps(): Promise<string> {
  const auth = getAuth();
  const webmasters = google.webmasters({ version: "v3", auth });

  const res = await webmasters.sitemaps.list({ siteUrl: SITE_URL });

  const sitemaps = res.data.sitemap;
  if (!sitemaps || sitemaps.length === 0) {
    return "No sitemaps submitted for this property.";
  }

  const header = `Sitemap                                          Status     Last Downloaded`;
  const divider = `──────────────────────────────────────────────────────────────────────────`;
  const lines = sitemaps.map((s) => {
    const path = (s.path ?? "").padEnd(49).slice(0, 49);
    const status = (s.isPending ? "pending" : "success").padEnd(10);
    const lastDownloaded = s.lastDownloaded ?? "never";
    return `${path} ${status} ${lastDownloaded}`;
  });

  return `SITEMAPS\n${divider}\n${header}\n${divider}\n${lines.join("\n")}`;
}

export const gscTool: ToolDefinition<typeof GscParams> = {
  name: "gsc",
  label: "Google Search Console",
  parameters: GscParams,
  description: `Query Google Search Console data for openclaws.blog.

Actions:
  - topQueries: Top search queries by clicks (with impressions, CTR, position)
  - topPages: Top pages by clicks (with impressions, CTR, position)
  - indexStatus: Inspect a specific URL's index status (requires url parameter)
  - sitemaps: List submitted sitemaps and their status

Parameters:
  - action: required — one of the above
  - days: lookback period, default 7, max 28 (for topQueries and topPages)
  - limit: max rows, default 10, max 25 (for topQueries and topPages)
  - url: required for indexStatus action`,

  async execute(_toolCallId, params) {
    const days = Math.min(Math.max(params.days ?? 7, 1), 28);
    const limit = Math.min(Math.max(params.limit ?? 10, 1), 25);

    try {
      let result: string;
      switch (params.action) {
        case "topQueries":
          result = await topQueries(days, limit);
          break;
        case "topPages":
          result = await topPages(days, limit);
          break;
        case "indexStatus":
          if (!params.url) {
            return {
              content: [{ type: "text" as const, text: "Error: url parameter is required for indexStatus action." }],
              details: undefined,
            };
          }
          result = await indexStatus(params.url);
          break;
        case "sitemaps":
          result = await listSitemaps();
          break;
        default:
          result = `Unknown action "${params.action}". Use one of: topQueries, topPages, indexStatus, sitemaps`;
      }

      return {
        content: [{ type: "text" as const, text: result }],
        details: undefined,
      };
    } catch (err: any) {
      const message = err.message || String(err);
      return {
        content: [{ type: "text" as const, text: `GSC API error: ${message}` }],
        details: undefined,
      };
    }
  },
};
