# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Warden is a CLI agent written in TypeScript that runs 24/7 on a Mac Mini. It uses `@mariozechner/pi-coding-agent` as the agent loop and **Supabase** as the task queue + persistence layer. Tasks are inserted into the DB and executed by a polling runner using pi-agent-core. No external queue service — the DB is the queue.

## Build and Run

```bash
npm run dev 2>&1 | tee log.txt   # Always use this — logs to terminal + log.txt
npm run build                     # Compile TypeScript
npm test                          # Run e2e tests (requires dev server running)
```

CLI flags: `--provider <anthropic|openrouter>` and `--model <model-id>`

### Running 24/7 with pm2

```bash
npm run build && pm2 start dist/index.js --name warden  # Start
pm2 save && pm2 startup                                  # Persist across reboots
npm run build && pm2 restart warden                      # Rebuild + restart
pm2 restart warden --update-env                          # Restart + reload .env
pm2 delete warden && pm2 save --force                    # Stop + remove
pm2 unstartup launchd                                    # Remove boot script
```

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
│   ├── session-store.ts      # Session persistence: caches AgentSessions per chat source (telegram-<chatId>, repl)
│   │                         #   Uses SessionManager JSONL files in ~/.warden/sessions/ for conversation continuity
│   │                         #   markNewSession() for /new, deriveSessionKey() for routing, getSessionForTask()
│   ├── runner.ts             # Polls Supabase for pending tasks (2s), claims & executes via pi-agent-core
│   │                         #   Reuses cached sessions for persistent sources (Telegram, REPL)
│   │                         #   Subscribes to session events → writes agent_steps + conversation_history
│   ├── repl.ts               # Interactive REPL — queues tasks to Supabase, supports /new to reset session
│   ├── config.ts             # Model/provider resolution: CLI args → env fallback
│   ├── prompt.ts             # System prompt for the Warden agent persona
│   ├── logger.ts             # Maps AgentSessionEvent types to agent_steps rows
│   ├── resolve-metadata.ts   # Resolves task metadata: explicit --metadata flag → WARDEN_TASK_METADATA env fallback
│   └── data_model/
│       ├── index.ts          # Barrel export for all data model types and DB helpers
│       ├── types.ts          # TypeScript interfaces: Task, AgentStep, ConversationHistory, TaskInput
│       └── db.ts             # Supabase client + typed helpers (insertTask, claimTask, completeTask, failTask,
│                             #   insertAgentStep, upsertConversationHistory, etc.)
├── tests/
│   └── resolve-metadata.test.ts  # E2E tests for metadata inheritance (cron → Telegram routing)
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

## Testing

Tests use Node's built-in test runner (`node:test`) and live against real Supabase. **The dev server must be running** (`npm run dev`) for e2e tests since they insert tasks and verify Warden processes them.

```bash
npm test   # Runs tests/**/*.test.ts via tsx
```

Test files live in the `tests/` directory (`tests/*.test.ts`). Current tests cover cron job metadata inheritance, session persistence, and session reset.

**Baseline tests are protected** — pre-commit hooks block deletion or assertion reduction in existing test files. New test files can be added freely.

## Definition of Done

A task is complete when ALL of the following are true:

1. `npm run build` passes with no type errors
2. `npm test` passes (all existing tests green)
3. New functionality has at least one test in `tests/`
4. No secrets or credentials are hardcoded (use `.env`)
5. Changes are committed with a descriptive message

## Do Not

- **Do not delete or weaken existing test files** — baseline tests are protected by pre-commit hooks and `.claude/settings.json`
- **Do not commit `.env`, credentials, or API keys** — use `.env.example` for documentation
- **Do not bypass git hooks** (`--no-verify`) — hooks enforce test protection and type checking
- **Do not use raw SQL** — all DB operations go through Supabase JS client helpers in `data_model/db.ts`
- **Do not add dependencies without justification** — prefer Node built-ins and existing libraries
- **Do not modify `dist/`** — it's generated by `npm run build`

## Environment Variables

See `.env.example` for the full list: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`, `TELEGRAM_BOT_TOKEN`, `WP_SSH`

## External CLI Tools

- **wp-cli** — WordPress CLI for blog publishing on openclaws.blog over SSH. Installed via Homebrew at `/opt/homebrew/bin/wp`. The agent uses `wp post create/update/list/delete --ssh="$WP_SSH"` via bash. Requires `WP_SSH` env var (e.g. `user@ssh.wp.com`).

## Related Repositories

- **OpenClaw** — https://github.com/openclaw/openclaw — Your own personal AI assistant. Any OS. Any Platform. The lobster way.
- **NanoClaw** — https://github.com/qwibitai/nanoclaw — A lightweight alternative to Clawdbot / OpenClaw that runs in containers for security. Connects to WhatsApp, has memory, scheduled jobs, and runs directly on Anthropic's Agents SDK.
