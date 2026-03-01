# Warden — System Architecture

## Overview

Warden is a CLI agent that automates tasks by writing and executing shell scripts. It sits on top of the `pi-*` library stack, which handles the LLM interaction, tool execution, and agent loop.

```
┌─────────────────────────────────────┐
│           User (stdin/stdout)       │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│          REPL (repl.ts)             │
│  readline input → session.prompt()  │
│  event stream → stdout              │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│      AgentSession (pi-coding-agent) │
│  - System prompt (prompt.ts)        │
│  - Model config (config.ts)         │
│  - Event subscription               │
│  - Session persistence              │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│        Agent (pi-agent-core)        │
│  - Agent loop (prompt → LLM → tool) │
│  - Tool call dispatch               │
│  - Message queue (steer/followUp)   │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│        LLM API (pi-ai)             │
│  - getModel() / streamSimple()      │
│  - Provider abstraction             │
│  - Token/cost tracking              │
└──────────────┬──────────────────────┘
               │
       ┌───────┴────────┐
       ▼                ▼
  Anthropic API    OpenRouter API
```

## Agent Loop

The core execution cycle is managed by `pi-agent-core`'s `Agent` class:

```
User input
    │
    ▼
agent.prompt(message)
    │
    ▼
┌─────────────────────────────┐
│  LLM Call (streamSimple)    │◄──────────┐
│  → text response            │           │
│  → tool calls               │           │
└─────────┬───────────────────┘           │
          │                               │
          ▼                               │
    ┌───────────┐                         │
    │ Tool call? │──── no ──► Done        │
    └─────┬─────┘                         │
          │ yes                           │
          ▼                               │
┌─────────────────────┐                   │
│  Execute tool        │                  │
│  (bash/read/write/   │                  │
│   edit/grep/find/ls) │                  │
└─────────┬───────────┘                   │
          │                               │
          ▼                               │
   Tool result ───────────────────────────┘
```

The loop continues until the LLM responds with text only (no tool calls) or hits the iteration cap.

## Event Flow

All communication between layers uses an event stream pattern:

```
Agent emits AgentEvent
    │
    ▼
AgentSession wraps as AgentSessionEvent
    │
    ▼
session.subscribe(listener) delivers to REPL
    │
    ▼
REPL writes to stdout
```

Key event types:
- `message_update` → streaming text/thinking deltas from the LLM
- `tool_execution_start` → tool begins (name, args)
- `tool_execution_end` → tool finishes (result)
- `turn_start` / `turn_end` → one full LLM call cycle
- `agent_start` / `agent_end` → full prompt-to-completion cycle

## Model Resolution

```
CLI args (--provider, --model)
    │
    ▼
config.ts: resolveModel(provider, modelId)
    │
    ▼
pi-ai: getModel(provider, modelId)
    │
    ▼
Model object (id, api, contextWindow, cost, etc.)
    │
    ▼
createAgentSession({ model, ... })
```

Provider selection checks env vars for API keys:
- `ANTHROPIC_API_KEY` → Anthropic provider
- `OPENROUTER_API_KEY` → OpenRouter provider

Default: `anthropic` / `claude-sonnet-4-20250514`

## Session Management

```
SessionManager.inMemory()  ← current (no persistence)
SessionManager.create(cwd) ← future (JSONL file persistence)
```

Sessions store the full conversation as append-only JSONL entries. The session manager supports branching (tree-structured conversations), compaction (summarizing old context to stay within token limits), and fork/restore operations.

## Built-in Tools

Provided by `pi-coding-agent`, these are the tools the LLM can invoke:

| Tool | Purpose |
|------|---------|
| `bash` | Execute shell commands (primary tool for Warden's use case) |
| `read` | Read file contents |
| `write` | Create/overwrite files |
| `edit` | Diff-style file patching |
| `grep` | Search file contents (optional) |
| `find` | Find files by pattern (optional) |
| `ls` | List directories (optional) |

Default active set: `[read, bash, edit, write]`

## Interruption Model

During streaming, user input can be queued in two ways:
- **steer** — interrupts the current agent run after the active tool finishes; remaining tool calls are skipped
- **followUp** — waits until the agent completes, then delivers as a new prompt

The REPL uses Ctrl+C to abort the current generation.
