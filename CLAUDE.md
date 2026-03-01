# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Warden is a CLI agent written in TypeScript that runs 24/7 on a Mac Mini. It uses `@mariozechner/pi-coding-agent` as the agent loop, **Supabase** for persistence/observability, and **QStash** for durable task scheduling. Tasks arrive via QStash webhooks, get stored in Supabase, and are executed by a polling runner using pi-agent-core.

## Build and Run

```bash
npm run dev              # Run with tsx (server + runner + repl)
npm run build            # Compile TypeScript
npm run setup-schedules  # Create QStash cron schedules
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
│       └── 001_initial_schema.sql  # 5 tables: tasks, execution_logs, sessions, config, schedules
├── scripts/
│   └── setup-schedules.ts    # Creates QStash cron schedules, mirrors to Supabase
├── src/
│   ├── index.ts              # Orchestrator: starts server + runner + repl, graceful shutdown
│   ├── server.ts             # HTTP server (node:http, port 3100) for QStash webhooks
│   │                         #   POST /webhook/task — receive task from QStash
│   │                         #   POST /webhook/schedule — receive scheduled task
│   │                         #   GET /health — health check
│   ├── runner.ts             # Polls Supabase for queued tasks (2s interval), claims & executes via pi-agent-core
│   ├── repl.ts               # Interactive REPL with two modes:
│   │                         #   direct — streams LLM responses inline
│   │                         #   queue — inserts tasks into Supabase for runner
│   ├── db.ts                 # Supabase client + typed helpers (insertTask, claimTask, completeTask, failTask, etc.)
│   ├── queue.ts              # QStash client (publishTask, createSchedule, signature key helpers)
│   ├── logger.ts             # Maps AgentSessionEvents → execution_logs rows in Supabase
│   ├── config.ts             # Model/provider resolution: CLI args → Supabase config table → env fallback
│   ├── prompt.ts             # System prompt for the Warden agent persona
│   └── types.ts              # TypeScript interfaces: Task, ExecutionLog, Session, Config, Schedule, TaskPayload
└── dist/                     # Compiled output (gitignored)
```

## Task Flow

QStash delivers → `server.ts` receives & verifies signature → inserts task into Supabase → `runner.ts` polls & claims task → runs pi-agent-core session → `logger.ts` logs events to Supabase → marks task complete/failed.

## Key Dependencies

- `@mariozechner/pi-coding-agent` — Agent session, built-in tools (read/write/edit/bash), `SessionManager`, `DefaultResourceLoader`
- `@mariozechner/pi-ai` — `getModel()`, unified LLM API across providers
- `@mariozechner/pi-agent-core` — Low-level `Agent` class, event types
- `@supabase/supabase-js` — Supabase client for database operations
- `@upstash/qstash` — QStash client for durable message queue
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

See `.env.example` for the full list: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `QSTASH_TOKEN`, `QSTASH_CURRENT_SIGNING_KEY`, `QSTASH_NEXT_SIGNING_KEY`, `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`, `WARDEN_WEBHOOK_URL`, `WARDEN_PORT`
