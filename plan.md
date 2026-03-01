# Warden - Initial Project Plan

## Context

Warden is a CLI agent that writes and runs CLI scripts to interact with external tools (Obsidian, GitHub CLI, etc.). It uses `@mariozechner/pi-agent-core` (via `pi-coding-agent`) as the agent loop, supports Anthropic and OpenRouter as model providers, and is written in TypeScript.

The agent starts with a simple stdin/stdout REPL interface, with a rich TUI (pi-tui) planned for later.

## Step 1: Initialize the project

- `npm init` with `"type": "module"` in package.json
- Install dependencies:
  ```
  @mariozechner/pi-ai
  @mariozechner/pi-agent-core
  @mariozechner/pi-coding-agent
  ```
- Install dev dependencies: `typescript`, `tsx`, `@types/node`
- Create `tsconfig.json` (target ESNext, module NodeNext, strict)
- Add scripts: `"dev": "tsx src/index.ts"`, `"build": "tsc"`

## Step 2: Create the entry point (`src/index.ts`)

- Parse CLI args for optional `--model` and `--provider` flags (default: `anthropic` / `claude-sonnet-4-20250514`)
- Create an agent session using `createAgentSession` from `pi-coding-agent`
  - Use `getModel()` from `pi-ai` to configure the model (anthropic or openrouter)
  - Use `streamSimple` from `pi-ai` as the stream function
  - Use `SessionManager.inMemory()` to start (file-based persistence later)
- Set up a system prompt tailored for CLI scripting tasks (interacting with Obsidian vault files, `gh` CLI, etc.)
- Wire up event subscription for streaming output to stdout

## Step 3: Build the REPL loop (`src/repl.ts`)

- Simple readline-based input loop
- Read user input line by line
- Send to `session.prompt(input)`
- Stream assistant responses to stdout via event subscription
- Handle `Ctrl+C` gracefully (abort current generation, or exit if idle)
- Support `/quit` or `/exit` commands

## Step 4: Configure model provider selection (`src/config.ts`)

- Read API keys from environment variables:
  - `ANTHROPIC_API_KEY` for Anthropic
  - `OPENROUTER_API_KEY` for OpenRouter
- Helper function `resolveModel(provider, modelId)` that calls `getModel()` with the right provider/model combo
- Default model: `anthropic/claude-sonnet-4-20250514`
- For OpenRouter, model IDs like `anthropic/claude-sonnet-4`

## Step 5: System prompt (`src/prompt.ts`)

- Define a system prompt that instructs the agent:
  - It is "Warden", a CLI agent that writes and executes scripts
  - It has access to read/write/edit/bash tools (provided by pi-coding-agent)
  - It specializes in automating tasks via CLI tools (gh, obsidian vault files, etc.)
  - It should write scripts, execute them, and report results
  - It should prefer using existing CLI tools over reimplementing functionality

## Project structure

```
warden/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts       # Entry point, arg parsing, agent setup
│   ├── repl.ts        # Simple readline REPL
│   ├── config.ts      # Model/provider configuration
│   └── prompt.ts      # System prompt definition
```

## Verification

1. `npm run dev` starts the REPL
2. Type a prompt like "list my GitHub repos using gh cli" → agent writes and runs the command
3. Test with both `ANTHROPIC_API_KEY` and `OPENROUTER_API_KEY`
4. Test `--provider openrouter --model anthropic/claude-sonnet-4` flag
