# Warden — AI Agent with Activity Self-Reporting

## Context

Create a new TypeScript/Node.js project from scratch: an AI agent powered by Anthropic Claude that logs every action it takes (LLM calls, tool usage, decisions) to a structured JSONL file. The agent has basic tools (file read/write, web search) and runs via CLI.

## File Structure

```
warden/
  package.json
  tsconfig.json
  src/
    types.ts      # Shared types (LogEntry, ToolDefinition, AgentConfig)
    logger.ts     # JSONL activity logger (appendFileSync)
    tools.ts      # Tool definitions + executors (read_file, write_file, web_search)
    agent.ts      # Core agentic loop (manual loop, not toolRunner)
    index.ts      # CLI entry point with arg parsing
```

## Implementation Steps

### 1. Project scaffolding
- Create `package.json` with `"type": "module"` and dependencies:
  - `@anthropic-ai/sdk` (runtime)
  - `typescript`, `tsx`, `@types/node` (dev)
- Create `tsconfig.json` targeting ES2022 with Node16 module resolution

### 2. `src/types.ts` — Shared types
- `LogEventType`: `"agent_start" | "llm_call" | "llm_response" | "tool_use" | "tool_result" | "agent_decision" | "agent_done" | "error"`
- `LogEntry`: timestamp, event, details, optional token_usage
- `ToolDefinition`: name, description, input_schema (Anthropic API format)
- `AgentConfig`: model, maxTokens, maxIterations, logFile, systemPrompt

### 3. `src/logger.ts` — Activity logger
- Class `ActivityLogger` with a `log(event, details, tokenUsage?)` method
- Appends one JSON line per call to the JSONL file via `fs.appendFileSync`
- Synchronous writes — correct ordering guaranteed, negligible cost vs LLM latency

### 4. `src/tools.ts` — Tool definitions and execution
Three tools in Anthropic API format:
| Tool | Input | Description |
|------|-------|-------------|
| `read_file` | `path: string` | Read file contents |
| `write_file` | `path: string, content: string` | Write content to file |
| `web_search` | `query: string` | Search via DuckDuckGo HTML, strip tags, truncate to 4000 chars |

Exports: `getToolDefinitions()` and `executeTool(name, input)`

### 5. `src/agent.ts` — Core agentic loop
Manual loop (not `toolRunner`) for full observability:
```
agent_start → LOOP { llm_call → llm_response → [tool_use → tool_result]* → agent_decision } → agent_done
```
- Logs every step to JSONL via ActivityLogger
- Token usage captured from each API response
- Tool results: log preview (500 chars) to JSONL, full content to LLM
- Safety cap: maxIterations (default 20)

### 6. `src/index.ts` — CLI entry point
- Parse args: `warden <prompt> [--log <file>] [--model <model>] [--max-tokens <n>] [--max-iterations <n>]`
- Validate `ANTHROPIC_API_KEY` env var
- Call `runAgent()`, print final answer to stdout

## Key Design Decisions

- **Manual loop over `toolRunner`**: We need to intercept every step for logging; `toolRunner` abstracts that away
- **`appendFileSync`**: Agent is single-threaded and sequential; sync writes guarantee ordering with zero complexity
- **No streaming**: Simplifies logging (log complete responses, not chunks); can add later
- **DuckDuckGo HTML scraping**: Works without API keys; replaceable with proper search API later
- **Minimal dependencies**: No zod, no commander, no logging library — not needed at this scale

## Verification

1. `npm install` — dependencies install cleanly
2. `npx tsx src/index.ts "What is 2+2?"` — agent responds without tool use, JSONL shows agent_start → llm_call → llm_response → agent_done
3. `npx tsx src/index.ts "Read package.json and summarize it"` — agent uses read_file tool, JSONL shows tool_use + tool_result entries
4. `npx tsx src/index.ts "Search the web for today's weather in Tokyo"` — agent uses web_search tool
5. `npx tsx src/index.ts "Write a haiku to haiku.txt"` — agent uses write_file tool, verify haiku.txt is created
6. Inspect `warden-activity.jsonl` — valid JSONL, correct event ordering, token usage present on llm_response entries
