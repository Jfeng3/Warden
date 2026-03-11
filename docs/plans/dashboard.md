# Dashboard — /dashboard on inkwarden.io

## Problem

CLI + Telegram is fine for the developer but not for marketing managers or prospects evaluating Warden. There's no visual way to see task history, cron job status, or scan results. A web dashboard on the same domain as the landing page makes Warden tangible.

## Decisions Needed

### 1. Scope for V1

Issue #22 (draft workflow) isn't built yet, so `/drafts` and `/posts` pages have no data source.

**Options:**
- **(a)** Build all 5 pages with empty states for drafts & posts
- **(b)** Build only what has data today: overview, tasks, cron jobs, scans

**Recommendation:** (b) — ship 3-4 pages that work now. Add drafts/posts pages when #22 lands.

### 2. Architecture — same app vs separate

The user wants `/dashboard` on inkwarden.io, so this goes inside `landing/app/dashboard/` as routes in the existing Next.js app. Shares the same Vercel deployment, `globals.css`, and design tokens.

### 3. Auth

No auth for V1. The Supabase anon key is read-only (RLS can be added later). The dashboard is informational — no write operations until #22 lands.

### 4. Environment variables

Add to Vercel and `.env.example`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

These are public by design (Supabase anon key is meant for client-side use, protected by RLS).

### 5. Data fetching

Server Components with `fetch` on page load (no client-side Supabase SDK needed for V1). Manual refresh — no realtime subscriptions yet.

---

## Pages

### `/dashboard` — Overview

- System status: is a task currently running? (green/idle indicator)
- Recent tasks (last 10): instruction preview, status badge, duration, timestamp
- Upcoming cron jobs: name, next_run_at, enabled toggle (read-only)
- Quick stats: total tasks today, success rate, total cost

### `/dashboard/tasks` — Task History

- Paginated table of all tasks (newest first)
- Filter by status: all / pending / running / done / failed
- Each row: id (short), instruction (truncated), status badge, created_at, duration
- Click row → expand to show full result/error and agent steps

### `/dashboard/cron` — Cron Jobs

- Table of all cron jobs
- Columns: name, schedule, timezone, enabled, last_run_at, next_run_at, run_count
- Link to last task via last_task_id

### `/dashboard/scans` — Daily Scan Results

- List of completed tasks from the `daily-v2cloud-scan` cron job
- Filter by date
- Each entry shows the task result (scan report markdown rendered as HTML)

---

## File Structure

```
landing/
├── app/
│   ├── dashboard/
│   │   ├── layout.tsx          # Dashboard shell: sidebar nav + main content area
│   │   ├── page.tsx            # Overview page
│   │   ├── tasks/
│   │   │   └── page.tsx        # Task history
│   │   ├── cron/
│   │   │   └── page.tsx        # Cron jobs
│   │   └── scans/
│   │       └── page.tsx        # Daily scans
│   ├── lib/
│   │   └── supabase.ts         # Supabase client for the dashboard (server-side)
│   ├── globals.css             # Existing — no changes needed
│   ├── layout.tsx              # Existing root layout
│   └── page.tsx                # Existing landing page
```

## Supabase Client

Create a server-side Supabase client in `landing/app/lib/supabase.ts` using `@supabase/supabase-js`. Used by Server Components to fetch data at request time.

```ts
import { createClient } from "@supabase/supabase-js";

export function createServerSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

## Dashboard Layout

Sidebar navigation (fixed left, ~200px):
- Logo/brand mark
- Nav links: Overview, Tasks, Cron Jobs, Scans
- Active state: phosphor highlight
- Back to landing page link

Main content area: full width remaining, scrollable.

Same design tokens as landing page — `bg-void`, `bg-onyx` cards, `border-border-subtle`, `font-mono` for labels/stats, `font-display` for page titles.

## Component Patterns

| Component | Purpose |
|-----------|---------|
| `StatusBadge` | Colored pill for task status (pending=yellow, running=cyan, done=green, failed=red) |
| `TaskRow` | Table row with instruction preview, status, timestamps |
| `CronRow` | Table row with cron job details |
| `StatCard` | Metric card (number + label) |
| `ScanReport` | Renders markdown task result as formatted HTML |

## Dependencies to Add (landing/)

- `@supabase/supabase-js` — Supabase client

No other new dependencies. Markdown rendering can use a simple regex-based approach or `dangerouslySetInnerHTML` with basic formatting — no heavy markdown library needed for V1.

## Implementation Order

1. Add `@supabase/supabase-js` to landing package
2. Create `lib/supabase.ts`
3. Create dashboard layout with sidebar
4. Build Overview page
5. Build Tasks page with status filters
6. Build Cron Jobs page
7. Build Scans page
8. Add env vars to Vercel, deploy
