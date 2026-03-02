# Warden — System Architecture

## Overview

Warden is a CLI agent that runs 24/7 on a Mac Mini, automating tasks by writing and executing shell scripts. It uses Supabase as a task queue and persistence layer, and `pi-agent-core` for the LLM agent loop. No external queue service needed — the DB is the queue.

```
┌─────────────────────────────────────┐
│  Task Sources                       │
│  (API / cron / REPL)                │
└──────────────┬──────────────────────┘
               │ INSERT task (status: pending)
               ▼
┌─────────────────────────────────────┐
│        Supabase (DB)                │
│  tasks · agent_steps · conversation_history │
└──────────────┬──────────────────────┘
               │ poll (2s)
               ▼
┌─────────────────────────────────────┐
│        Runner (runner.ts)           │
│  claim oldest pending → running     │
│  run pi-agent-core agent loop       │
│  log events + checkpoint each step  │
│  done → next pending                │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│      AgentSession (pi-coding-agent) │
│  - System prompt (prompt.ts)        │
│  - Model config (config.ts)         │
│  - Event subscription               │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│        Agent (pi-agent-core)        │
│  - Agent loop (prompt → LLM → tool) │
│  - Tool call dispatch               │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│        LLM API (pi-ai)             │
│  - getModel() / streamSimple()      │
│  - Provider abstraction             │
│  - Token/cost tracking              │
└──────────────┬──────────────────────┘
               │
       ┌───────┴────────┐
       ▼                ▼
  Anthropic API    OpenRouter API
```

## Task Flow

```
Task source (API / cron / REPL)
    │
    ▼
INSERT into tasks (status: pending, created_at)
    │
    ▼
Runner polls DB (2s interval)
    → claim oldest pending → status: running
    → create AgentSession
    → session.subscribe(event => write DB)   ← listen, don't break the loop
    → session.prompt(task.instruction)        ← pi-agent-core owns the loop
    │
    ▼
┌─────────────────────────────┐
│  LLM Call (streamSimple)    │◄──────────┐
│  → text response            │           │
│  → tool calls               │           │
└─────────┬───────────────────┘           │
          │                               │
          ▼                               │
    ┌───────────┐                         │
    │ Tool call? │──── no ──► Done        │
    └─────┬─────┘                         │
          │ yes                           │
          ▼                               │
┌─────────────────────────┐               │
│  Execute tool            │              │
└─────────┬───────────────┘               │
          │                               │
          ▼                               │
   Tool result ───────────────────────────┘

Meanwhile, session.subscribe() fires on every event:
    tool_execution_end  → INSERT into agent_steps
    turn_end            → UPSERT conversation_history
    agent_end           → UPDATE tasks status: done
```

pi-agent-core controls the loop internally. We don't break it — we **subscribe to events** and write to DB as a side effect.

Tasks execute serially — one at a time, ordered by `created_at`.

## DB Schema (3 tables)

| Table | Purpose |
|-------|---------|
| `tasks` | Task queue. Fields: id, instruction, status (pending/running/done/failed), created_at, started_at, completed_at, result, error |
| `agent_steps` | Append-only log of each LLM call and tool execution with full input/output. Enables replay and debugging of any task. |
| `conversation_history` | Latest serialized conversation (message array) per task. Overwritten after each tool step. Used for crash recovery — reload and resume from where we left off. |

## Crash Recovery

```
Process starts
    │
    ▼
Check DB: any task with status: running?
    │
    ├── yes → load conversation_history → resume agent loop from last step
    │
    └── no → normal polling for pending tasks
```

## Event Subscription → DB Writes

pi-agent-core emits events at every step of the loop. We subscribe once and write to DB:

```ts
session.subscribe(async (event) => {
    // Log every tool execution to agent_steps
    if (event.type === "tool_execution_end") {
        await db.insertAgentStep({ task_id, tool, input, output });
    }
    // Snapshot conversation after each turn for crash recovery
    if (event.type === "turn_end") {
        await db.upsertConversationHistory({ task_id, messages });
    }
});
```

| Event | DB Write | Purpose |
|-------|----------|---------|
| `tool_execution_end` | INSERT agent_steps | Debug log — what tool ran, with what args, what result |
| `turn_end` | UPSERT conversation_history | Crash recovery — latest conversation state |
| `agent_end` | UPDATE tasks → done | Mark task complete |

Other events (available but not persisted by default):
- `message_update` → streaming text/thinking deltas from the LLM
- `tool_execution_start` → tool begins (name, args)
- `turn_start` → one LLM call cycle begins
- `agent_start` → full prompt-to-completion cycle begins

## Model Resolution

```
CLI args (--provider, --model)
    │
    ▼
config.ts: resolveModel(provider, modelId)
    │
    ▼
pi-ai: getModel(provider, modelId)
    │
    ▼
Model object (id, api, contextWindow, cost, etc.)
    │
    ▼
createAgentSession({ model, ... })
```

Provider selection checks env vars for API keys:
- `ANTHROPIC_API_KEY` → Anthropic provider
- `OPENROUTER_API_KEY` → OpenRouter provider

Default: `anthropic` / `claude-sonnet-4-20250514`

## Built-in Tools

Provided by `pi-coding-agent`, these are the tools the LLM can invoke:

| Tool | Purpose |
|------|---------|
| `bash` | Execute shell commands (primary tool for Warden's use case) |
| `read` | Read file contents |
| `write` | Create/overwrite files |
| `edit` | Diff-style file patching |
| `grep` | Search file contents (optional) |
| `find` | Find files by pattern (optional) |
| `ls` | List directories (optional) |

Default active set: `[read, bash, edit, write]`

## Process Model

Warden runs as a single long-lived process on the Mac Mini:

```
index.ts
    │
    ├── server.ts  — HTTP server (POST /api/task for external task submission, GET /health)
    ├── runner.ts  — Polls DB, claims & executes tasks sequentially
    └── repl.ts    — Interactive mode (optional, for local debugging)
```

Graceful shutdown: SIGINT/SIGTERM → finish current agent step → mark task as failed if incomplete → exit.
