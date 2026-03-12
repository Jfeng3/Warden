# Daily Blog Publish Pipeline

**Date**: 2026-03-12
**Cron Job ID**: `c821d429-a3ee-4575-9978-1d703a4f3558`
**Schedule**: Daily 8am PT
**Publish Mode**: Draft (requires manual `/approve` via Telegram)

## Problem

The blog publishing workflow was manual and inconsistent. The previous `biweekly-blog-publish` cron job ran only Wed/Sun and did not separate research, auditing, and fixing into distinct steps — leading to posts with unresolved SEO and AEO issues.

## Design

A fully automated daily pipeline that researches trending topics across all 4 content pillars, drafts a post, runs separate SEO and AEO audits, then fixes all issues in a dedicated review step before publishing as a draft for human approval.

### Topic Pillars (skills/topic.md)

Every post must map to at least one pillar:

1. **Getting Discovered by AI Agents** — AEO, structured data, AI visibility
2. **Agent Skills** — capabilities, use cases, real-world applications
3. **Agent Setup & DevOps** — deployment, configuration, monitoring, reliability
4. **Hosting** — infrastructure, cloud vs local, cost trade-offs

### 9-Step Workflow

```
STEP 1: RESEARCH
  → Load skills/youdotcom-cli
  → Search all 4 topic pillars via You.com API (freshness=day)
  → Collect 2-3 findings per pillar

STEP 2: PICK THE BEST TOPIC
  → Select most compelling topic across all pillars
  → Deep research via You.com Research endpoint (effort=deep)

STEP 3: NOTIFY TOPIC SELECTION
  → Send Telegram notification: topic title, pillar, source URL, angle

STEP 4: DRAFT
  → Load skills/content-style.md
  → Write 2,000-3,000 word blog post as HTML
  → Problem-first, branded metaphors, non-technical audience

STEP 5: SEO AUDIT (no edits)
  → Load skills/seo-audit.md
  → Produce numbered list of all SEO issues

STEP 6: AEO AUDIT (no edits)
  → Load skills/aeo-audit.md
  → Produce numbered list of all AEO issues

STEP 7: REVIEW & FIX
  → Combine SEO + AEO issue lists
  → Fix all issues in one pass:
    - Title tag, meta description, URL slug
    - Primary keyword optimization
    - Internal links (real published posts on openclaws.blog)
    - External links (authoritative sources)
    - Definition paragraphs, first-person authority, recency signals
    - FAQ improvements for AI extraction
  → Final read-through for flow and consistency

STEP 8: PUBLISH
  → Load skills/publish.md
  → Publish as draft (publish_mode=draft)
  → Assign english category

STEP 9: NOTIFY DRAFT READY
  → Load skills/notification.md
  → Send Telegram: post title, pillar, draft post ID, /approve or /reject
```

### Skills Used

| Step | Skill | Purpose |
|------|-------|---------|
| 1 | `youdotcom-cli` | Web search via You.com API |
| 1-2 | `topic` | 4 topic pillars — every post must map to one |
| 3, 9 | `notification` | Telegram formatting rules |
| 4 | `content-style` | Writing style, audience rules, structure template |
| 5 | `seo-audit` | On-page SEO checklist |
| 6 | `aeo-audit` | Answer Engine Optimization checklist |
| 8 | `publish` | wp-cli reference, post-publish checklist |

### Key Design Decisions

1. **Separate audit from fix** — Steps 5-6 produce issue lists without editing. Step 7 applies all fixes in one pass. This prevents partial fixes and ensures a coherent final read-through.

2. **Auto-pick topic, no human-in-the-loop for selection** — Initially designed with a "send 3 options, wait for reply" flow, but Telegram messages create new tasks instead of resuming the running one. Reverted to auto-pick with a notification so the user knows what's being written.

3. **Draft mode by default** — Posts publish as drafts. User reviews via Telegram (`/approve <post-id>` or `/reject <post-id>`).

4. **Research via You.com only** — Uses `skills/youdotcom-cli` (You.com REST API) for web search and deep research. Does not use `skills/research.md` (which uses `au` CLI for Reddit/HN).

5. **All 4 pillars searched every day** — Not rotating through pillars. Every run searches all 4 and picks the best topic across all of them.

## Metadata

```json
{
  "source": "telegram",
  "chatId": 7823756809
}
```

## Model

`anthropic/claude-opus-4-6` via OpenRouter (changed from `claude-sonnet-4` on 2026-03-12).

## Related Changes

- `skills/topic.md` — New skill defining the 4 topic pillars
- `CLAUDE.md` — Updated content pipeline flow and skills table
- `src/config.ts` — Default model changed to `claude-opus-4-6`
