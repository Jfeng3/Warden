# Skill Directory Migration

**Status**: Completed (2026-03-12)
**Commits**: `f8eef32`, `af10476`

## Problem

1. **You.com skill not loading** — The `youdotcom-cli` skill was a subdirectory (`skills/youdotcom-cli/SKILL.md`) but the skill loader only supported flat `.md` files. The agent fell back to `au` CLI or skipped research entirely.
2. **No mid-task Telegram notifications** — The notification skill only had formatting rules. The agent couldn't send Telegram messages during a task (e.g., topic selection alerts), only after completion via the runner.
3. **Stale session context** — Cron job tasks shared a persistent Telegram session, causing the agent to skip steps it "remembered" completing in prior runs.
4. **Inconsistent skill format** — Some skills were flat files (`skills/foo.md`), others were directories (`skills/youdotcom-cli/SKILL.md`). The loader only handled the flat format.

## Design

### Skill Loader Update (`src/skill-tool.ts`)

Support both formats in `loadSkills()`:
- **Flat**: `skills/<name>.md` → skill name = filename without `.md`
- **Directory**: `skills/<name>/SKILL.md` → skill name = directory name

Priority: if both exist for the same name, the flat file wins (first match).

### Notification Send Script (`skills/notification/send.sh`)

A bash script that sends Telegram messages via the Bot API. Reads message from stdin to avoid shell escaping issues with HTML content.

```bash
# Usage (recommended — pipe from file to avoid escaping issues)
cat > /tmp/tg-msg.html <<'MSG'
<b>Hello</b>
MSG
bash skills/notification/send.sh 7823756809 < /tmp/tg-msg.html
```

Requires `TELEGRAM_BOT_TOKEN` in environment, `curl`, and `jq`.

### System Prompt Update (`src/prompt.ts`)

- Replaced `au` CLI references with `youdotcom-cli` as the primary research tool
- Removed "HN, Reddit, YouTube, tech news" as research channels

### Skill Migrations

| Old (flat) | New (directory) | Notes |
|---|---|---|
| `skills/topic.md` | `skills/select-topic/SKILL.md` | Renamed; added topic notification template |
| `skills/content-style.md` | `skills/draft/SKILL.md` | Renamed to match workflow step |
| `skills/publish.md` | `skills/publish/SKILL.md` | Format change only |
| `skills/seo-audit.md` | `skills/seo-audit/SKILL.md` | Replaced `au` commands with You.com API |
| `skills/aeo-audit.md` | `skills/aeo-audit/SKILL.md` | Format change only |
| `skills/notification.md` | `skills/notification/SKILL.md` | Added send script docs + `send.sh` |
| (symlink) | `skills/youdotcom-cli/SKILL.md` | Copied from `.agents/`, symlink removed |

### Topic Pillars (select-topic)

Consolidated from 4 to 4 pillars (merged + added):
1. Getting Discovered by AI Agents (unchanged)
2. Agent Skills (unchanged)
3. Agent Infrastructure (merged "Agent Setup & DevOps" + "Hosting")
4. Agent Economics (new — ROI, TCO, build vs buy)

### Cleanup

- Removed `.agents/` directory (contained skill symlink sources)
- Removed `.claude/skills/` directory (Claude Code skills, not used by Warden runtime)

## Files Modified

- `src/skill-tool.ts` — Directory skill support in `loadSkills()`
- `src/prompt.ts` — Research tool and capabilities references
- `skills/select-topic/SKILL.md` — New (replaces `topic.md`)
- `skills/draft/SKILL.md` — New (replaces `content-style.md`)
- `skills/publish/SKILL.md` — Moved
- `skills/seo-audit/SKILL.md` — Moved + updated
- `skills/aeo-audit/SKILL.md` — Moved
- `skills/notification/SKILL.md` — Moved + updated
- `skills/notification/send.sh` — New
- `skills/youdotcom-cli/SKILL.md` + `assets/` — New (6 JSON schemas)

## Cron Job Updates (DB only)

- `daily-blog-publish` instruction updated to reference new skill names
- `biweekly-blog-publish` removed (redundant with daily job)
- `daily-v2cloud-scan` and `daily-scan-summary` re-created after accidental deletion
