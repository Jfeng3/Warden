import { createAgentSession, createCodingTools, DefaultResourceLoader, SessionManager } from "@mariozechner/pi-coding-agent";
import type { AgentSession } from "@mariozechner/pi-coding-agent";
import { resolveModel } from "./config.js";
import { buildSystemPrompt } from "./prompt.js";
import { skillTool } from "./skill-tool.js";
import { wpTool } from "./wp-tool.js";
import { gscTool } from "./gsc-tool.js";
import type { Task } from "./data_model/index.js";
import path from "node:path";
import fs from "node:fs";
import os from "node:os";

const SESSIONS_DIR = path.join(os.homedir(), ".warden", "sessions");

// Cache: sessionKey → AgentSession
const sessionCache = new Map<string, AgentSession>();

// Keys marked for reset — next getSessionForTask creates a fresh session
const pendingResets = new Set<string>();

/**
 * Derive a session key from task metadata.
 * Returns null for stateless tasks (cron, no metadata).
 */
export function deriveSessionKey(metadata: Record<string, unknown> | null | undefined): string | null {
  if (!metadata) return null;
  if (metadata.cron) return null; // cron tasks are stateless

  if (metadata.source === "telegram" && metadata.chatId != null) {
    return `telegram-${metadata.chatId}`;
  }
  if (metadata.source === "repl") {
    return "repl";
  }
  return null;
}

/**
 * Mark a session key for reset. The next task from this source
 * will create a fresh session instead of resuming.
 * Does NOT dispose the session immediately — it may be in active use.
 * Disposal happens in getSessionForTask when the next task arrives.
 */
export function markNewSession(key: string): void {
  pendingResets.add(key);

  // #15: Clear cached session immediately so /context sees the reset
  const old = sessionCache.get(key);
  sessionCache.delete(key);
  old?.dispose();

  // #14: Clear session files on disk so reset survives pm2 restart
  const sessionDir = path.join(SESSIONS_DIR, key);
  if (fs.existsSync(sessionDir)) {
    for (const file of fs.readdirSync(sessionDir)) {
      if (file.endsWith(".jsonl")) {
        fs.unlinkSync(path.join(sessionDir, file));
      }
    }
  }
}

/**
 * Get or create an AgentSession for a task.
 * - Persistent sessions: Telegram chats and REPL get file-based SessionManagers
 * - Stateless tasks: cron/unknown get in-memory sessions (no history)
 */
export async function getSessionForTask(
  task: Task,
  provider: string,
  modelId: string
): Promise<AgentSession> {
  const key = deriveSessionKey(task.metadata);

  // Stateless task — always create fresh in-memory session
  if (!key) {
    return buildSession(SessionManager.inMemory(), provider, modelId);
  }

  // Check if we need to reset this session
  let freshAfterReset = false;
  if (pendingResets.has(key)) {
    pendingResets.delete(key);
    const old = sessionCache.get(key);
    sessionCache.delete(key);
    old?.dispose();
    freshAfterReset = true;
  }

  // Return cached session if available
  const cached = sessionCache.get(key);
  if (cached) {
    return cached;
  }

  // Create or resume a persistent session
  // After /new reset: SessionManager.create() starts a blank session (ignores old JSONL files)
  // Normal resume: SessionManager.continueRecent() loads the most recent session from disk
  const sessionDir = path.join(SESSIONS_DIR, key);
  const sessionManager = freshAfterReset
    ? SessionManager.create(process.cwd(), sessionDir)
    : SessionManager.continueRecent(process.cwd(), sessionDir);

  const session = await buildSession(sessionManager, provider, modelId);
  sessionCache.set(key, session);
  return session;
}

/**
 * Get the cached session for a given key (e.g. "repl", "telegram-123").
 * Returns undefined if no session is cached.
 */
export function getCachedSession(key: string): AgentSession | undefined {
  return sessionCache.get(key);
}

/**
 * Build a fresh in-memory session with optional additional custom tools.
 * Used by the runner for per-step execution in multi-step workflows.
 */
export async function buildFreshSession(
  provider: string,
  modelId: string,
  extraTools?: any[]
): Promise<AgentSession> {
  return buildSession(SessionManager.inMemory(), provider, modelId, extraTools);
}

async function buildSession(
  sessionManager: SessionManager,
  provider: string,
  modelId: string,
  extraTools?: any[]
): Promise<AgentSession> {
  const model = resolveModel(provider, modelId);

  const resourceLoader = new DefaultResourceLoader({
    systemPrompt: buildSystemPrompt(),
    noExtensions: true,
    noSkills: true,
    noPromptTemplates: true,
    noThemes: true,
  });
  await resourceLoader.reload();

  // Block git and gh commands — this agent focuses on content, not code
  const BLOCKED_COMMANDS = ["git", "gh"];
  const tools = createCodingTools(process.cwd(), {
    bash: {
      spawnHook: (context) => {
        const firstWord = context.command.trimStart().split(/\s+/)[0];
        if (BLOCKED_COMMANDS.includes(firstWord)) {
          throw new Error(
            `Command '${firstWord}' is not available. Use the wp tool for WordPress operations and bash for other tasks.`
          );
        }
        return context;
      },
    },
  });

  const { session } = await createAgentSession({
    model,
    sessionManager,
    resourceLoader,
    tools,
    customTools: [skillTool as any, wpTool as any, gscTool as any, ...(extraTools ?? [])],
  });

  return session;
}
