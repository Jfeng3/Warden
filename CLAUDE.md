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

All pm2 commands log stdout+stderr to `log.txt` in the project root via `--output`/`--error`/`--merge-logs`.

```bash
npm run build && pm2 start dist/index.js --name warden --output /Users/jie/Codes/warden/log.txt --error /Users/jie/Codes/warden/log.txt --merge-logs  # Start
pm2 save && pm2 startup                                  # Persist across reboots
npm run build && pm2 delete warden && pm2 start dist/index.js --name warden --output /Users/jie/Codes/warden/log.txt --error /Users/jie/Codes/warden/log.txt --merge-logs  # Rebuild + restart
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
├── docs/
│   ├── plans/
│   │   └── initial_plan.md   # Original project plan
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
├── landing/                  # Next.js landing page for openclaws.blog (deployed to Vercel)
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

## Design Docs

- **Always create feature design docs in `docs/plans/`** — before implementing a feature, write a design doc (e.g. `docs/plans/feature-name.md`) covering the problem, design, schema changes, files to modify, and implementation order. Get approval before coding.

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

## Automated Content Workflow

Warden runs an automated content marketing pipeline for **openclaws.blog**, targeting **solo operators and one-person companies** — freelancers, consultants, agency-of-one founders, and micro-SaaS builders who run their entire business alone.

### V2Cloud Partnership

V2Cloud (v2cloud.com) is a **co-marketing partner**, not a competitor. We share the same audience (SMB decision-makers, IT managers) with complementary positioning: they sell managed cloud VMs, we write about self-hosted AI automation. Weekly sync with their content marketing manager to discuss collaboration.

**Content rule**: Never write adversarial content ("you don't need cloud desktops"). Always write complementary content that both sites would cross-link to. Every topic idea must pass: "Would V2Cloud's content team happily link to this?"

### Cron Jobs

| Job | Schedule | What It Does |
|-----|----------|-------------|
| `daily-v2cloud-scan` | Daily 8am PT | Monitors V2Cloud site for content changes. Classifies each as new vs refresh, generates 1-2 **complementary** topic ideas for openclaws.blog. Uses `co-marketing` skill. |
| `biweekly-blog-publish` | Wed + Sun 9am PT | Reviews topic ideas from recent daily scans, picks the best one, writes a full blog post, and **publishes** it on WordPress. Uses `content-style` + `seo-audit` skills. |
| `Ting walk reminder` | Daily 3pm PT | Sends walk reminder to Telegram. |

### Content Pipeline Flow

```
Daily scan (8am PT)
  → Query V2Cloud REST API for posts/pages modified in last 24h
  → Classify: new content vs refresh
  → Generate 1-2 topic ideas with scoring (keyword overlap, content gap, co-marketing potential)
  → Each topic idea MUST map to at least one pillar from the topic skill (skills/topic.md)
  → Report findings via task result

Wed + Sun (9am PT)
  → Collect topic ideas from recent daily scans
  → Pick best topic based on scoring criteria + topic pillar coverage
  → Load topic skill (ensure post maps to a pillar)
  → Load content-style skill (audience rules, branded metaphors, structure template)
  → Load seo-audit skill (on-page SEO checklist)
  → Draft full blog post (1,200-1,500 words)
  → Load seo-audit skill → audit draft → edit to fix SEO issues
  → Load aeo-audit skill → audit draft → edit to fix AEO issues
  → Publish to WordPress via wp-cli: wp post create --post_status=publish --ssh="$WP_SSH"
```

### Skills Used in Content Workflow

| Skill | File | Purpose |
|-------|------|---------|
| `topic` | `skills/topic.md` | Four topic pillars: AI discovery/AEO, agent skills, agent setup/DevOps, hosting. Every post must map to at least one. |
| `content-style` | `skills/content-style.md` | Writing style, structure template, **target audience rules**, branded metaphor patterns, jargon blacklist |
| `co-marketing` | `skills/co-marketing.md` | V2Cloud partner monitoring, complementary topic generation, REST API + sitemap + Wayback scanning |
| `seo-audit` | `skills/seo-audit.md` | On-page SEO checklist, keyword research workflow |
| `aeo-audit` | `skills/aeo-audit.md` | Answer Engine Optimization for AI-generated answers (ChatGPT, Perplexity, Google AI Overviews) |
| `publish` | `skills/publish.md` | wp-cli reference, page IDs (Home=37, About=1, Blog=38), site settings |
| `notification` | `skills/notification.md` | Telegram formatting rules, routing setup, message length limits |

### Target Audience

All blog content targets **solo operators and one-person companies** — people who run their entire business alone and need content marketing that doesn't eat their week. Key rules enforced by `content-style` skill:

- No unexplained developer jargon (SSH, Docker, pm2, API keys, etc.)
- Branded metaphors repeated as anchors ("The Always-On Tax", "The Deployment Desert", etc.)
- Time savings and solo-operator outcomes over technical details (hours reclaimed, consistent publishing, AI visibility)
- Case study personas are solo operators (freelance consultants, one-person agency owners, indie founders), not corporate managers

### WordPress Site Structure

| Page ID | Page | Purpose |
|---------|------|---------|
| 37 | Home | Hero headline, value propositions, latest posts |
| 1 | About | Blog mission, what we cover, our tools |
| 38 | Blog | Blog listing page |

Site tagline: "The agent guide for solo business owners"

### Notifications

All cron jobs MUST send results to Telegram. When creating a cron job, always include `--metadata '{"source":"telegram","chatId":7823756809}'`. Follow the `notification` skill for formatting rules: plain text only (no markdown **bold** or *italics*), use bullet points (•) and ALL CAPS headers, keep messages scannable. See `skills/notification.md` for full details.

### Managing Cron Jobs

```bash
# List all cron jobs
npx tsx src/cron-cli.ts list

# Add a new cron job (ALWAYS include --metadata for Telegram delivery)
# Instructions live in cron-jobs/<job-name>.md — no --instruction flag needed
npx tsx src/cron-cli.ts add --name "job-name" --cron "0 8 * * *" --tz "America/Los_Angeles" --metadata '{"source":"telegram","chatId":7823756809}'

# Disable/enable
npx tsx src/cron-cli.ts update <id> --enabled false
npx tsx src/cron-cli.ts update <id> --enabled true

# Delete
npx tsx src/cron-cli.ts delete <id>
```

## Landing Page

The `landing/` directory contains a standalone Next.js app for the openclaws.blog landing page. It is a separate project from the main Warden CLI.

```bash
cd landing
npm run dev              # Local dev server (http://localhost:3000)
npm run build            # Production build
```

**Deploy**: Always run from the `landing/` directory — Vercel needs the Root Directory to contain `package.json` with `next`:
```bash
cd /Users/jie/Codes/warden/landing && npx vercel --prod
```

- **Stack**: Next.js 15, React 19, Tailwind CSS v4, TypeScript
- **Deployed to**: Vercel
- **Design**: Dark terminal-noir theme with amber/cyan accents
- **Key sections**: Hero with animated terminal, pipeline visualization, AEO features, stats, branded concepts
- **Target buyer**: Content marketing managers/directors (e.g. V2Cloud's content team)

### Landing Page Messaging Rules

1. **Never mention monitoring or scanning other companies' sites** — no "scans partner sites," "monitors V2Cloud," "competitive scanning," or anything implying surveillance of another company's content. Frame capabilities as "industry trend analysis" or "content gap research" instead.
2. **Never say content is fully AI-written** — position as "AI-assisted content marketer" or "AI content assistant." The AI drafts and optimizes; humans review and approve. Never say "no human in the loop," "autonomously written," or "100% automated."
3. **Frame for content marketing buyers** — every feature should answer "why should a content director pay for this?" Focus on AEO, time savings, consistent publishing cadence, and brand citation by AI models.

## Related Repositories

- **OpenClaw** — https://github.com/openclaw/openclaw — Your own personal AI assistant. Any OS. Any Platform. The lobster way.
- **NanoClaw** — https://github.com/qwibitai/nanoclaw — A lightweight alternative to Clawdbot / OpenClaw that runs in containers for security. Connects to WhatsApp, has memory, scheduled jobs, and runs directly on Anthropic's Agents SDK.
