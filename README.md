# Warden

An easy to understand local agent that runs 24/7 on a Mac Mini. It uses Supabase as a task queue and persistence layer — no external queue service, the database is the queue.

## How It Works

```
                  ┌──────────────┐
                  │   index.ts   │  ← Entry point: starts all three subsystems
                  └──┬───┬───┬───┘
                     │   │   │
          ┌──────────┘   │   └──────────┐
          ▼              ▼              ▼
   ┌────────────┐  ┌───────────┐  ┌──────────┐
   │ server.ts  │  │ runner.ts │  │ repl.ts  │
   │ (HTTP API) │  │ (poller)  │  │ (CLI)    │
   └─────┬──────┘  └─────┬─────┘  └────┬─────┘
         │               │             │
         └───────┬───────┘─────────────┘
                 ▼
         ┌───────────────┐
         │  data_model/  │  ← Types + Supabase helpers
         └───────┬───────┘
                 ▼
         ┌───────────────┐
         │   Supabase    │  ← Tasks, agent steps, conversation history
         └───────────────┘
```

### Startup (`index.ts`)

The orchestrator. It loads environment variables, parses CLI flags (`--provider`, `--model`), and boots three subsystems in order:

1. **HTTP server** — accepts new tasks via API
2. **Task runner** — polls the database and executes tasks
3. **REPL** — interactive terminal for local use

It also handles graceful shutdown on `SIGTERM`.

### HTTP Server (`server.ts`)

A plain `node:http` server on port 3100 with two routes:

- `POST /api/task` — accepts `{ "instruction": "..." }`, inserts a new task into Supabase, returns the task ID.
- `GET /health` — returns `{ "status": "ok" }`.

When a task is submitted, it calls `insertTask()` from the data model, which writes a row to the `tasks` table with status `pending`.

### Task Runner (`runner.ts`)

The core execution loop. It polls Supabase every 2 seconds looking for the oldest `pending` task.

When it finds one:
1. **Claims it** — atomically sets status to `running` (prevents duplicate execution)
2. **Creates an agent session** — using `@mariozechner/pi-coding-agent` with the model from `config.ts` and the system prompt from `prompt.ts`
3. **Subscribes to events** — every tool call, text response, and turn boundary is logged to the `agent_steps` table via `logger.ts`
4. **Runs the prompt** — `session.prompt(task.instruction)` drives the full agent loop (LLM reasoning, tool use, etc.)
5. **Marks done or failed** — writes the result or error back to the `tasks` table

On startup, it also marks any tasks stuck in `running` as `failed` (crash recovery).

### Event Logger (`logger.ts`)

Translates agent session events into `agent_steps` database rows. It tracks four event types:

- `tool_execution_start` — records the tool name and arguments
- `tool_execution_end` — records the tool result and whether it errored
- `turn_end` — records token usage and cost for that turn
- `agent_end` — records cumulative totals for the entire task

Failures are logged to console but never crash the runner.

### REPL (`repl.ts`)

An interactive terminal with two modes:

- **Direct mode** — creates its own agent session and streams responses directly to the terminal. Good for testing.
- **Queue mode** — inserts tasks into Supabase just like the HTTP API. The runner picks them up. Good for simulating production.

Switch between modes with `/direct` and `/queue`. Exit with `/quit`.

### Config (`config.ts`)

Resolves which LLM provider and model to use. Priority: CLI flags > environment variables > defaults (Anthropic, Claude Sonnet). Also validates that the required API key is set for the chosen provider.

### System Prompt (`prompt.ts`)

Defines the Warden persona — a CLI agent that writes and executes shell scripts. It has access to `bash`, `read`, `write`, and `edit` tools and is guided to prefer existing CLI tools, handle errors gracefully, and keep scripts simple.

### Data Model (`data_model/`)

All database types and operations live here. Three files, one barrel export:

- **`types.ts`** — TypeScript interfaces that mirror the database schema: `Task`, `AgentStep`, `ConversationHistory`, `TaskInput`, and the `TaskStatus` union type.
- **`db.ts`** — Supabase client singleton and all database helpers: `insertTask`, `pollNextTask`, `claimTask`, `completeTask`, `failTask`, `failStuckTasks`, `insertAgentStep`, `upsertConversationHistory`, `getConversationHistory`.
- **`index.ts`** — Re-exports everything so consumers import from `data_model/index.js`.

### Database Schema (`supabase/migrations/001_initial_schema.sql`)

Three tables:

| Table | Purpose |
|---|---|
| `tasks` | The task queue. Each row is a unit of work with a status lifecycle: `pending` → `running` → `done`/`failed`. |
| `agent_steps` | Append-only event log. Every tool call, result, and token usage record for a task. |
| `conversation_history` | Full message array for each task (one row per task). Used for crash recovery. |

## Task Lifecycle

```
User submits task (HTTP API or REPL)
        │
        ▼
  tasks table (status: pending)
        │
        ▼
  runner.ts polls → claims task (status: running)
        │
        ▼
  Agent session executes instruction
  ├── Each event → agent_steps table (via logger.ts)
  └── Each turn  → conversation_history table
        │
        ▼
  Task completes (status: done) or fails (status: failed)
```

## Setup

1. Copy `.env.example` to `.env` and fill in: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY` (and optionally `OPENROUTER_API_KEY`, `WARDEN_PORT`).
2. Run the migration in `supabase/migrations/001_initial_schema.sql` against your Supabase project.
3. `npm install && npm run dev`
