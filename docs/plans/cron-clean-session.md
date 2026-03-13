# Cron Job Clean Session

**Status**: In Progress (2026-03-12)

## Problem

`cron-cli.ts cmdRun()` creates tasks without `cron: true` in metadata, so manually triggered cron jobs reuse cached Telegram sessions with stale conversation history instead of getting fresh sessions.

The automatic scheduler (`cron.ts`) correctly injects `cron: true`, but the manual trigger (`cron-cli.ts run`) does not — the two code paths diverged.

## Design

### Centralized `createCronTask()` (`src/cron-task.ts`)

Extract a shared function that both `cron.ts` and `cron-cli.ts` use to create tasks from cron jobs. This guarantees consistent metadata regardless of trigger source.

```typescript
export async function createCronTask(job: CronJob): Promise<Task> {
  const metadata: Record<string, unknown> = {
    ...(job.task_metadata ?? {}),
    cron: true,
  };
  if (job.publish_mode === "draft") {
    metadata.publish_mode = "draft";
  }
  return insertTask({ instruction: job.instruction, metadata });
}
```

### Call-site updates

- **`src/cron.ts`** — Replace inline `insertTask` + metadata construction with `createCronTask(job)`
- **`src/cron-cli.ts` `cmdRun()`** — Replace `insertTask({ instruction, metadata })` with `createCronTask(job)`

### Test update

- **`tests/resolve-metadata.test.ts`** — Assert that manually fired cron tasks include `cron: true` in metadata (in addition to existing Telegram metadata)

## Why this approach

- Single source of truth — no way for the two code paths to diverge again
- Minimal change surface (one new tiny file, two call-site updates)
- No DB migrations or schema changes
- `publish_mode` logic also centralized (was only in `cron.ts` before)

## Files Modified

- `src/cron-task.ts` — New: shared `createCronTask()` function
- `src/cron.ts` — Use `createCronTask()` instead of inline task creation
- `src/cron-cli.ts` — Use `createCronTask()` in `cmdRun()`
- `tests/resolve-metadata.test.ts` — Assert `cron: true` in fired task metadata
