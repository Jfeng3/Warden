---
trigger: When planning, reviewing, or updating the editorial calendar
description: Editorial calendar management for openclaws.blog
---
# Content Calendar

Manage the editorial calendar for openclaws.blog. The calendar is a markdown file at `content/calendar.md` -- simple, version-controlled, and editable.

## Calendar Format

The calendar uses a markdown table:

```markdown
| Date | Topic | Status | Target Keywords | Notes |
|------|-------|--------|-----------------|-------|
| 2026-03-10 | Local AI Agents: Complete Guide | idea | local ai agent, self-hosted ai | Comparison angle |
| 2026-03-17 | Why Open-Source AI Assistants Win | drafting | open source ai assistant | Thought leadership |
| 2026-03-24 | Setting Up OpenClaw on Mac | published | openclaw setup, ai assistant mac | Tutorial |
```

**Status values**: `idea`, `drafting`, `review`, `published`

## Topic Categories

Rotate between these content types for variety:

1. **Tutorials** -- Step-by-step guides (e.g. "How to set up OpenClaw on Ubuntu")
2. **Comparisons** -- Product comparisons (e.g. "OpenClaw vs Cursor vs Continue")
3. **Thought Leadership** -- Industry trends (e.g. "Why local-first AI is the future")
4. **Case Studies** -- Real usage stories (e.g. "How I automated my blog with Warden")
5. **Explainers** -- Concept deep-dives (e.g. "What is an AI agent and why should you care?")

## Publishing Cadence

- Target: **1-2 posts per week**
- Best days: Tuesday and Thursday (higher developer traffic)
- Maintain a buffer of 2-3 ideas in the pipeline at all times

## Managing the Calendar

```bash
# View the current calendar
cat content/calendar.md

# Add a new topic (edit the file directly)
# Move topics through statuses as they progress
```

## Scheduling Automated Publishing

Use cron jobs for scheduled content tasks:

```bash
# Weekly content planning session every Monday at 9am
npx tsx src/cron-cli.ts add --name "weekly-content-plan" --cron "0 9 * * MON" --tz "America/Los_Angeles" --instruction "Review the content calendar at content/calendar.md. Check what's due this week, suggest 1-2 new topic ideas based on trending topics (use au news and au reddit), and update the calendar."

# Bi-weekly competitive scan
npx tsx src/cron-cli.ts add --name "competitive-scan" --cron "0 10 * * MON,THU" --tz "America/Los_Angeles" --instruction "Use the competitive-intel skill to scan competitor repos and Reddit for notable updates. Report findings via Telegram."
```

## Keyword Research Workflow

1. Use `au reddit` and `au news` to find what developers are asking about
2. Check if openclaws.blog already covers the topic
3. Find the gap -- what's missing or outdated in existing content?
4. Add to the calendar with target keywords
