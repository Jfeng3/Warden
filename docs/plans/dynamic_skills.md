# Dynamic Skills System

Make skills self-describing and plug-and-play. Drop a `.md` file in `skills/`, it auto-registers with trigger conditions. No more editing `prompt.ts` when skills change.

## Current Problems

1. `prompt.ts` hardcodes skill names (line 16, 79) — must edit when skills change
2. Skill names duplicated in system prompt AND tool description
3. No trigger conditions — agent guesses when to use skills
4. No user-invocable skill commands in REPL/Telegram

## Changes

### 1. Add YAML frontmatter to skill files

Each `.md` file gets a `trigger` and optional `description` field:

```markdown
---
trigger: When writing or editing blog content
description: Writing style guide for openclaws.blog
---
# Content Style Guide
...
```

Parse with simple regex (no deps). Fall back to first `# heading` for description if no frontmatter.

### 2. Update `skill-tool.ts` — parse frontmatter

- `loadSkills()`: parse YAML frontmatter, extract `trigger` and `description`
- `SkillEntry`: add `trigger?: string` field
- `buildDescription()`: include trigger conditions in the tool description

### 3. Make `prompt.ts` dynamic

- Export `buildSystemPrompt()` function that calls `listSkillSummaries()` from skill-tool
- `listSkillSummaries()` returns formatted skill list with triggers
- Remove hardcoded skill names from lines 16 and 79

### 4. Add `/skill <name>` command to REPL + Telegram

- REPL: `/skill publish` injects skill content as task instruction prefix
- Telegram: same pattern, `/skill publish`
- List skills with `/skills` (already exists in REPL)

### 5. Files touched

- `skills/*.md` — add frontmatter to all 7 files
- `src/skill-tool.ts` — frontmatter parsing, `listSkillSummaries()`
- `src/prompt.ts` — dynamic `buildSystemPrompt()`
- `src/repl.ts` — add `/skill <name>` command
- `src/telegram.ts` — add `/skill <name>` command
