# Tools & Skills System Comparison: Claude Code vs Warden

## Architecture Overview

| Aspect | Claude Code | Warden |
|--------|------------|--------|
| Built-in tools | Read, Write, Edit, Bash, Glob, Grep, Agent, Skill, WebFetch, WebSearch + more | bash, read, write, edit (from pi-coding-agent) |
| Custom tools | MCP servers (unlimited, multi-scope) | 1 custom tool: `skill` |
| Deferred tools | Yes — ToolSearch discovers and loads on demand | No — all tools always in context |
| Skills | SKILL.md with rich frontmatter (model, context, hooks, allowed-tools) | .md files with simple frontmatter (trigger, description) |
| Context budget | Explicit tracking + autocompact | None — grows unbounded |

## Tools

### Claude Code

**Built-in tools** (~10+) are always loaded with compact schemas (~1-2K tokens total). They include file ops (Read, Write, Edit), search (Glob, Grep), execution (Bash), web (WebFetch, WebSearch), and orchestration (Agent, Skill, ToolSearch).

**MCP tools** connect external services (GitHub, Slack, Sentry, etc.). Each MCP server exposes tools with full JSON schemas. Problem: 5 servers can consume ~55K tokens in tool definitions alone.

**Deferred tool loading (ToolSearch)** solves this:
- Auto-activates when MCP tool schemas exceed 10% of context window
- Only a single `ToolSearch` tool is loaded (~1K tokens)
- Agent searches by keyword, gets back 3-5 tool references (~3K tokens)
- Those tools become available for that interaction only
- **Result: 85%+ context savings** (55K → 8-11K tokens)

### Warden

**5 tools total**, always loaded:
- `bash`, `read`, `write`, `edit` — built-in from pi-coding-agent (loaded transparently)
- `skill` — single custom tool registered via `customTools` array

**No deferred loading** — with only 5 tools, there's no need. Tool schemas are small and always fit in context.

**No MCP support** — all external capabilities (au, wp-cli, gh) are accessed via the `bash` tool as shell commands. The agent constructs CLI invocations as text, not structured tool calls.

### Gap Analysis

| Feature | Claude Code | Warden | Impact |
|---------|------------|--------|--------|
| Structured tool params | Yes — typed schemas per tool | No — agent writes bash strings | Lower reliability, no validation |
| Tool discovery | ToolSearch with keyword matching | N/A (5 tools) | Not needed at current scale |
| MCP ecosystem | Pluggable external tools | Shell commands only | Harder to add new integrations |
| Tool-level permissions | Allow/deny per tool | None | Less safety control |

## Skills

### Claude Code

**Rich skill metadata** via SKILL.md frontmatter:
```yaml
name: skill-name
description: What this does          # Used for trigger matching
disable-model-invocation: true       # Agent can't auto-invoke
user-invocable: false                # Hidden from /slash menu
allowed-tools: Read, Grep            # Restrict tools while active
model: opus                          # Override model for this skill
context: fork                        # Run in isolated subagent
agent: Explore                       # Which subagent type
hooks:                               # Lifecycle hooks
  - event: UserPromptSubmit
    handler: ./validate.sh
```

**Context budget**: Skill descriptions get 2% of context window (~4K chars at 200K context). If too many skills, some descriptions are excluded. Configurable via `SLASH_COMMAND_TOOL_CHAR_BUDGET`.

**Invocation modes**:
- User-invocable: `/skill-name` from chat
- Model-invocable: Agent auto-detects from task + description match
- Both (default)
- Neither (disabled)

**Subagent execution**: Skills with `context: fork` run in isolated subagents with their own context window. Only the result comes back to the main conversation.

### Warden

**Simple frontmatter**:
```yaml
trigger: When publishing blog posts on openclaws.blog
description: wp-cli reference for openclaws.blog
```

**Two fields only**: `trigger` and `description`. No model override, no tool restrictions, no subagent support, no hooks.

**Invocation**:
- User: `/skill <name> [args]` in REPL or Telegram
- Agent: calls `skill` tool with skill name
- No auto-invocation logic — agent must decide from skill summaries in prompt

**Loading**:
- Skill summaries baked into system prompt via `listSkillSummaries()` (~800 chars)
- Skill summaries also in `skill` tool description via `buildDescription()`
- Full content returned as tool result when called (~70-140 lines per skill)

### Gap Analysis

| Feature | Claude Code | Warden | Impact |
|---------|------------|--------|--------|
| Frontmatter fields | 8+ (model, context, hooks, etc.) | 2 (trigger, description) | Less control per skill |
| Description budget | 2% of context, enforced | No budget, always included | Could bloat with many skills |
| Auto-invocation | Smart matching from description | Agent guesses from summaries | May miss relevant skills |
| Subagent execution | `context: fork` isolates skill | No isolation | Skill content stays in main context |
| Tool restrictions | `allowed-tools` per skill | None | Can't limit tool access |
| Hooks | Pre/post execution hooks | None | No validation or side effects |
| Supporting files | reference.md, examples.md loaded on demand | Single .md file only | Less modular |

## Context Management

### Claude Code

**Explicit budget tracking** visible via `/context`:
```
System prompt:   3.6K tokens (1.8%)
System tools:    9.7K tokens (4.9%)
Custom agents:   152 tokens (0.1%)
Memory files:    2.5K tokens (1.2%)
Skills:          262 tokens (0.1%)
Messages:        36.9K tokens (18.4%)
Free space:      114K (56.9%)
Autocompact:     33K tokens (16.5%)
```

**Autocompact**: When context approaches ~80%, automatically:
1. Clears old tool outputs (Read, Grep, Bash results)
2. Summarizes early conversation messages
3. Preserves: system prompt, CLAUDE.md, recent messages, active skill content

**Manual control**: `/compact focus on <topic>` to compact with specific focus.

### Warden

**Basic estimation** via `/context`:
```
System prompt: 13035 chars
Est. context: ~24785 tokens (99141 chars)
```

- Character count / 4 = rough token estimate
- No budget tracking per component
- No autocompact or summarization
- No message pruning
- Context grows until the provider's limit is hit

### Gap Analysis

| Feature | Claude Code | Warden | Impact |
|---------|------------|--------|--------|
| Per-component tracking | Yes (prompt, tools, skills, messages) | Total chars only | Can't diagnose context bloat |
| Autocompact | Yes, automatic at ~80% | None | Long sessions may hit limits |
| Manual compact | `/compact` with focus topics | None | Can't reclaim space |
| Budget enforcement | Skills excluded if over 2% budget | No enforcement | Unbounded growth |
| Deferred loading | Tools + skills load on demand | Skills on demand, tools always | Good for skills, N/A for tools |

## Recommendations for Warden

### Quick Wins (Low effort, high value)

1. **Remove skill summary duplication** — summaries appear in both the system prompt AND the skill tool description. Pick one place (tool description is more natural).

2. **Move cron docs to a skill** — the cron/scheduling section is ~40 lines in the system prompt. Make it a `cron` skill that loads on demand. Same for the WordPress reference line.

3. **Add basic context tracking** — enhance `/context` to show breakdown: system prompt tokens, tool schema tokens, skill content in messages, total message tokens.

### Medium Effort

4. **Add autocompact** — when estimated context exceeds a threshold (e.g., 80% of model limit), summarize older messages and drop old tool results. This would prevent long Telegram sessions from hitting limits.

5. **Expand skill frontmatter** — add `model` override (use cheaper model for research tasks) and `allowed-tools` (restrict to read-only for research skills).

### Larger Investments

6. **MCP support** — register `au` subcommands as proper tools with typed parameters instead of bash strings. Better error handling, structured outputs, and the agent wouldn't need to remember CLI syntax.

7. **Subagent skills** — skills with `context: fork` that run in isolation. Useful for research tasks that read many files without bloating the main conversation.
