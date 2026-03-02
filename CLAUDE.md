# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Warden is a CLI agent written in TypeScript that runs 24/7 on a Mac Mini. It uses `@mariozechner/pi-coding-agent` as the agent loop and **Supabase** as the task queue + persistence layer. Tasks are inserted into the DB and executed by a polling runner using pi-agent-core. No external queue service — the DB is the queue.

## Build and Run

```bash
npm run dev 2>&1 | tee log.txt   # Always use this — logs to terminal + log.txt
npm run build                     # Compile TypeScript
```

CLI flags: `--provider <anthropic|openrouter>` and `--model <model-id>`

## File Structure

```
warden/
├── package.json
├── tsconfig.json
├── .env.example              # All required env vars (copy to .env)
├── .gitignore
├── CLAUDE.md                 # This file
├── architecture.md           # Detailed system architecture docs
├── plans/
│   └── initial_plan.md       # Original project plan
├── supabase/
│   └── migrations/
│       ├── 001_initial_schema.sql  # 3 tables: tasks, agent_steps, conversation_history
│       └── 002_add_task_metadata.sql  # Adds metadata jsonb column to warden_tasks
├── src/
│   ├── index.ts              # Orchestrator: starts telegram bot + runner + repl, graceful shutdown
│   ├── telegram.ts           # Telegram bot integration (optional, enabled by TELEGRAM_BOT_TOKEN)
│   │                         #   Long polling via grammY — receives messages → insertTask()
│   │                         #   notifyTaskComplete() — sends result back to Telegram chat
│   ├── runner.ts             # Polls Supabase for pending tasks (2s), claims & executes via pi-agent-core
│   │                         #   Subscribes to session events → writes agent_steps + conversation_history
│   │                         #   Crash recovery: resumes running tasks from conversation_history on startup
│   ├── repl.ts               # Interactive REPL — queues tasks to Supabase
│   ├── config.ts             # Model/provider resolution: CLI args → env fallback
│   ├── prompt.ts             # System prompt for the Warden agent persona
│   ├── logger.ts             # Maps AgentSessionEvent types to agent_steps rows
│   └── data_model/
│       ├── index.ts          # Barrel export for all data model types and DB helpers
│       ├── types.ts          # TypeScript interfaces: Task, AgentStep, ConversationHistory, TaskInput
│       └── db.ts             # Supabase client + typed helpers (insertTask, claimTask, completeTask, failTask,
│                             #   insertAgentStep, upsertConversationHistory, etc.)
└── dist/                     # Compiled output (gitignored)
```

## Task Flow

Task submitted (REPL or Telegram) → INSERT into warden_tasks table (status: pending) → `runner.ts` polls & claims oldest pending → creates AgentSession → subscribes to events (writes agent_steps + conversation_history to DB each step) → `session.prompt()` runs full agent loop → marks task done/failed → sends Telegram reply if task came from Telegram → picks next pending.

## Key Dependencies

- `@mariozechner/pi-coding-agent` — Agent session, built-in tools (read/write/edit/bash), `SessionManager`, `DefaultResourceLoader`
- `@mariozechner/pi-ai` — `getModel()`, unified LLM API across providers
- `@mariozechner/pi-agent-core` — Low-level `Agent` class, event types
- `@supabase/supabase-js` — Supabase client for database operations (task queue + persistence)
- `grammy` — Telegram Bot API framework (long polling, no webhook needed)
- `dotenv` — Loads `.env` into `process.env`

## API Patterns

- `createAgentSession()` is **async** — returns `Promise<{ session, extensionsResult }>`
- `SessionManager` is imported from `@mariozechner/pi-coding-agent` (not pi-agent-core)
- System prompt is set via `DefaultResourceLoader({ systemPrompt: "..." })`, not a direct option on `createAgentSession`
- `getModel(provider, modelId)` requires `KnownProvider` type — cast with `as KnownProvider` for dynamic strings
- `session.subscribe(event => ...)` for streaming events (`message_update`, `tool_execution_start/end`)
- `session.prompt(text)` to send user input
- Text deltas: `event.type === "message_update" && event.assistantMessageEvent.type === "text_delta"`

## Environment Variables

See `.env.example` for the full list: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`, `TELEGRAM_BOT_TOKEN`
