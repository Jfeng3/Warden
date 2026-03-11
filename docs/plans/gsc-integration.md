# Google Search Console Integration

Issue: #24

## Problem

We have no visibility into how Google indexes and ranks openclaws.blog. We don't know which queries bring traffic, whether all posts are indexed, or if there are crawl errors. GSC is free and has an API — we should automate pulling this data.

## Approach

**Option B: Custom tool** — a `gsc-tool.ts` using the `googleapis` npm package, following the `wp-tool.ts` pattern. The GSC API requires OAuth2 via service account, which is painful in curl but handled cleanly by the Google SDK.

## Prerequisites (Manual Steps)

Before the code works, you need to:

1. **Verify openclaws.blog in GSC** — go to [Google Search Console](https://search.google.com/search-console), add property, verify via DNS TXT record or HTML file
2. **Create a Google Cloud project** — go to [console.cloud.google.com](https://console.cloud.google.com), create a project (or use existing)
3. **Enable the Search Console API** — in the project's API Library, search "Search Console API" and enable it
4. **Create a service account** — IAM & Admin → Service Accounts → Create, download the JSON key file
5. **Grant access** — in GSC, Settings → Users and permissions → Add the service account email as a user (read-only is fine)
6. **Save the key file** — place it at `~/.warden/gsc-service-account.json` (or wherever, referenced by env var)

## Design

### New Files

| File | Purpose |
|------|---------|
| `src/gsc-tool.ts` | Custom tool wrapping the GSC API (like `wp-tool.ts`) |
| `skills/gsc.md` | Skill teaching the agent how to use the `gsc` tool and interpret results |

### Modified Files

| File | Change |
|------|--------|
| `src/session-store.ts` | Register `gscTool` as a custom tool alongside `skillTool` and `wpTool` |
| `.env.example` | Add `GSC_KEY_PATH` |
| `package.json` | Add `googleapis` dependency |

### No Schema Changes

No new DB tables or migrations needed. The cron job is added via CLI, not code.

## gsc-tool.ts

Follows the `wp-tool.ts` pattern: a `ToolDefinition` with typed parameters.

### Actions

```typescript
type GscAction = "topQueries" | "topPages" | "indexStatus" | "sitemaps";
```

| Action | What it does | GSC API endpoint |
|--------|-------------|-----------------|
| `topQueries` | Top queries by clicks, impressions, CTR, position | `searchanalytics.query` with dimensions: `query` |
| `topPages` | Top pages by clicks, impressions | `searchanalytics.query` with dimensions: `page` |
| `indexStatus` | URL inspection for specific URLs | `urlInspection.index.inspect` |
| `sitemaps` | List submitted sitemaps and their status | `sitemaps.list` |

### Parameters

```typescript
const GscParams = Type.Object({
  action: Type.String({ description: "One of: topQueries, topPages, indexStatus, sitemaps" }),
  days: Type.Optional(Type.Number({ description: "Lookback period in days (default: 7, max: 28)" })),
  limit: Type.Optional(Type.Number({ description: "Max rows to return (default: 10, max: 25)" })),
  url: Type.Optional(Type.String({ description: "URL to inspect (required for indexStatus)" })),
});
```

### Auth

```typescript
import { google } from "googleapis";

function getAuth() {
  const keyPath = process.env.GSC_KEY_PATH;
  if (!keyPath) throw new Error("GSC_KEY_PATH not set");

  return new google.auth.GoogleAuth({
    keyFile: keyPath,
    scopes: [
      "https://www.googleapis.com/auth/webmasters.readonly",
      "https://www.googleapis.com/auth/indexing",  // for URL inspection
    ],
  });
}
```

The SDK handles token refresh automatically.

### Response Format

Return human-readable formatted text (not raw JSON) so the agent can include it directly in Telegram reports:

```
TOP QUERIES (last 7 days)
─────────────────────────
 #  Query                        Clicks  Impr   CTR    Pos
 1  ai agent deployment           42     890    4.7%   3.2
 2  mac mini ai agents            38     650    5.8%   5.1
 3  aeo optimization              25     420    6.0%   7.4
 ...
```

### Error Handling

Follow `wp-tool.ts` pattern: return error as text content, don't throw. The agent sees the error and can report it.

## skills/gsc.md

A lightweight skill that tells the agent:
- What each action does and when to use it
- How to interpret the metrics (clicks, impressions, CTR, position)
- How to format findings for Telegram using the notification skill's rules
- Suggested analysis: compare week-over-week, flag posts with high impressions but low CTR (optimization opportunities)

## Cron Job

Added via CLI after deployment (not hardcoded):

```bash
npx tsx src/cron-cli.ts add \
  --name "weekly-gsc-report" \
  --cron "0 9 * * MON" \
  --tz "America/Los_Angeles" \
  --metadata '{"source":"telegram","chatId":7823756809}' \
  --instruction "Load the gsc skill. Run the topQueries and topPages actions for the last 7 days. Summarize findings: which queries are driving traffic, which pages are performing best, and any pages with high impressions but low CTR (optimization opportunities). Format the report for Telegram following the notification skill rules."
```

Weekly on Monday 9am PT — aligns with GSC's 2-3 day data lag (reports on full prior week data).

## Dependencies

| Package | Why | Size impact |
|---------|-----|-------------|
| `googleapis` | Official Google API client, handles OAuth2, typed API methods | ~large, but we only import `google.auth` + `google.webmasters` + `google.searchconsole` |

Alternative: `google-auth-library` + raw `fetch` calls — smaller but more code to maintain. Recommend `googleapis` for reliability.

## Implementation Order

1. `npm install googleapis`
2. Create `src/gsc-tool.ts` — tool definition with all 4 actions
3. Create `skills/gsc.md` — skill for interpreting GSC data
4. Modify `src/session-store.ts` — register `gscTool`
5. Update `.env.example` — add `GSC_KEY_PATH`
6. Build + test manually (`npm run build`)
7. Add cron job via CLI
8. Write test in `tests/`

## Environment Variables

```bash
# Google Search Console (optional — path to service account JSON key)
GSC_KEY_PATH=~/.warden/gsc-service-account.json
```

## Open Questions

- [ ] Is openclaws.blog already verified in GSC?
- [ ] Should we also track a specific set of target keywords and alert on position changes?
- [ ] Do we want the URL Inspection API (requires separate scope) or is search analytics enough for V1?
