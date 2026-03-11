# Implementation Plan: Simplify to DB-only Architecture

## Context
Warden currently has a QStash + Supabase architecture with 5 DB tables, QStash webhook verification, schedule management, etc. We decided to simplify: **drop QStash entirely, use Supabase DB as the task queue**, and rely on pi-agent-core's event subscription for per-step DB writes. The architecture docs (architecture.md, CLAUDE.md) are already updated; now we align the code.

## Changes Overview

### Delete files
- `src/queue.ts` — QStash client, no longer needed
- `scripts/setup-schedules.ts` — QStash schedule setup, no longer needed

### Rewrite files (8 files + 1 migration)

#### 1. `supabase/migrations/001_initial_schema.sql`
- **5 tables → 3 tables**: drop `sessions`, `config`, `schedules`
- Rename `execution_logs` → `agent_steps` with updated columns
- Add `conversation_history` table (task_id unique, messages jsonb)
- Rename task field `prompt` → `instruction`
- Task status: `pending`/`running`/`done`/`failed` (was queued/running/completed/failed/cancelled)
- Drop `priority`, `retry_count`, `max_retries`, `session_id`, `idempotency_key`, `context` from tasks
- `agent_steps`: id, task_id, step_type, tool_name, tool_args (jsonb), tool_result (text), is_error (bool), tokens_in, tokens_out, cost_usd, created_at
- `conversation_history`: id, task_id (unique FK), messages (jsonb), updated_at

#### 2. `src/types.ts`
- Simplify `Task`: id, instruction, status, result, error, created_at, updated_at, started_at, completed_at
- Replace `ExecutionLog` → `AgentStep`: id, task_id, step_type, tool_name, tool_args, tool_result, is_error, tokens_in, tokens_out, cost_usd, created_at
- Add `ConversationHistory`: id, task_id, messages (unknown[]), updated_at
- Remove `Session`, `Config`, `Schedule`, `TaskPayload`
- Add `TaskInput`: { instruction: string }

#### 3. `src/db.ts`
- Remove all session/config/schedule helpers
- Remove `insertLog` (replaced by `insertAgentStep`)
- Update task helpers: status `queued`→`pending`, `completed`→`done`, field `prompt`→`instruction`
- Remove `claimNextTask` (RPC), simplify to poll+claim pattern
- Remove `resetStuckTasks` → replace with `failStuckTasks` (mark as failed, not re-queue)
- Add `insertAgentStep(step)` — INSERT into agent_steps
- Add `upsertConversationHistory(taskId, messages)` — UPSERT into conversation_history
- Add `getConversationHistory(taskId)` — SELECT for potential future recovery

#### 4. `src/server.ts`
- Remove QStash signature verification (`verifySignature`, `getSigningKeys` import)
- Remove `/webhook/task` and `/webhook/schedule` routes
- Add `POST /api/task` — accepts `{ instruction: string }`, inserts task, returns task_id
- Keep `GET /health`
- Much simpler: ~50 lines

#### 5. `src/logger.ts`
- Rename internal references: `insertLog` → `insertAgentStep`
- Update event mapping to write `AgentStep` rows instead of `ExecutionLog` rows
- Remove `session_id` from all writes
- Add `step_type` field: "tool_start", "tool_end", "turn_end", "agent_end"

#### 6. `src/runner.ts`
- Remove `createSession`, `updateSessionStats` imports
- Add `upsertConversationHistory` import
- On startup: `failStuckTasks()` instead of `resetStuckTasks()`
- In `executeTask`: remove DB session creation, simplify logger to just task_id
- Add conversation_history save in subscribe callback on `turn_end`
- Update status names: `completeTask` stays but uses `done` internally
- Collect token stats from logger, store in task result metadata

#### 7. `src/config.ts`
- Remove `getConfigValue` import and Supabase config lookup
- `getEffectiveConfig`: just CLI args → env defaults (no DB layer)
- Keep `resolveModel`, `parseCliArgs` as-is

#### 8. `src/index.ts`
- Remove QStash reference in comment
- Minor: remove `setup-schedules` script reference if in comments

#### 9. `src/repl.ts`
- Update `insertTask` call: `{ prompt: input }` → `{ instruction: input }`
- Minor text updates

### Config files
- `.env.example` — remove QStash vars (`QSTASH_TOKEN`, signing keys, `WARDEN_WEBHOOK_URL`)
- `package.json` — remove `@upstash/qstash` dependency, remove `setup-schedules` script

## Verification
1. `npm run build` — TypeScript compiles cleanly
2. Manual test: `npm run dev` — server starts, runner polls, REPL works
3. POST to `/api/task` with `{ "instruction": "echo hello" }` → task appears in DB
4. Runner picks up task, executes, writes agent_steps + conversation_history
5. Task completes with status `done`
