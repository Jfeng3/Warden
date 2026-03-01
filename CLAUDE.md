# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Warden is a CLI agent written in TypeScript that writes and runs CLI scripts to interact with external tools (Obsidian, GitHub CLI, etc.). It uses `@mariozechner/pi-coding-agent` (which wraps `pi-agent-core` and `pi-ai`) as the agent loop, supports Anthropic and OpenRouter as model providers, and runs as a stdin/stdout REPL.

## Build and Run

```bash
npm run dev          # Run with tsx (development)
npm run build        # Compile TypeScript
```

CLI flags: `--provider <anthropic|openrouter>` and `--model <model-id>`

## Architecture

- **src/index.ts** — Entry point. Parses CLI args, creates an agent session via `createAgentSession` from `pi-coding-agent`, wires up event streaming, starts the REPL.
- **src/repl.ts** — Readline-based REPL loop. Sends user input to `session.prompt()`, handles `/quit`, `/exit`, and Ctrl+C.
- **src/config.ts** — Model/provider resolution. Reads `ANTHROPIC_API_KEY` / `OPENROUTER_API_KEY` from env, provides `resolveModel(provider, modelId)` using `getModel()` from `pi-ai`.
- **src/prompt.ts** — System prompt definition for the Warden agent persona.

## Key Dependencies

- `@mariozechner/pi-coding-agent` — Agent session, built-in tools (read/write/edit/bash), session management
- `@mariozechner/pi-ai` — `getModel()`, `streamSimple()`, unified LLM API across providers
- `@mariozechner/pi-agent-core` — Low-level `Agent` class, `SessionManager`

## API Patterns

- `createAgentSession({ model, sessionManager: SessionManager.inMemory(), ... })` returns `{ session }`
- `session.subscribe(event => ...)` for streaming events (`message_update`, `tool_execution_start/end`)
- `session.prompt(text)` to send user input
- Text deltas: `event.type === "message_update" && event.assistantMessageEvent.type === "text_delta"`
