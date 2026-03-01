import { createAgentSession, DefaultResourceLoader, SessionManager } from "@mariozechner/pi-coding-agent";
import {
  pollNextTask,
  claimTask,
  completeTask,
  failTask,
  createSession,
  updateSessionStats,
  resetStuckTasks,
} from "./db.js";
import { resolveModel } from "./config.js";
import { SYSTEM_PROMPT } from "./prompt.js";
import { createEventLogger } from "./logger.js";
import type { Task } from "./types.js";

let running = false;
let pollInterval: ReturnType<typeof setInterval> | null = null;

async function executeTask(task: Task, provider: string, modelId: string) {
  console.log(`[runner] Executing task ${task.id}: "${task.prompt.slice(0, 60)}"`);

  const model = resolveModel(provider, modelId);
  const dbSession = await createSession(task.id, modelId, provider);
  const logger = createEventLogger(task.id, dbSession.id);

  const resourceLoader = new DefaultResourceLoader({
    systemPrompt: SYSTEM_PROMPT,
    noExtensions: true,
    noSkills: true,
    noPromptTemplates: true,
    noThemes: true,
  });
  await resourceLoader.reload();

  const { session } = await createAgentSession({
    model,
    sessionManager: SessionManager.inMemory(),
    resourceLoader,
  });

  // Collect final assistant text
  let assistantText = "";

  session.subscribe((event) => {
    // Log to Supabase
    logger.log(event as Record<string, unknown>);

    // Collect text output
    if (event.type === "message_update") {
      const msgEvent = (event as any).assistantMessageEvent as
        | { type: string; delta?: string }
        | undefined;
      if (msgEvent?.type === "text_delta" && msgEvent.delta) {
        assistantText += msgEvent.delta;
      }
    }
  });

  try {
    await session.prompt(task.prompt);
    const stats = logger.getStats();
    await updateSessionStats(
      dbSession.id,
      stats.totalTokensIn,
      stats.totalTokensOut,
      stats.totalCostUsd
    );
    await completeTask(task.id, assistantText || "(no output)");
    console.log(`[runner] Task ${task.id} completed`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[runner] Task ${task.id} failed:`, msg);
    const stats = logger.getStats();
    await updateSessionStats(
      dbSession.id,
      stats.totalTokensIn,
      stats.totalTokensOut,
      stats.totalCostUsd
    );
    await failTask(task.id, msg);
  }
}

async function pollAndRun(provider: string, modelId: string) {
  if (!running) return;

  try {
    const task = await pollNextTask();
    if (!task) return;

    const claimed = await claimTask(task.id);
    if (!claimed) return; // Another runner got it

    await executeTask(task, provider, modelId);
  } catch (err) {
    console.error(`[runner] Poll error:`, err);
  }
}

export async function startRunner(
  provider: string,
  modelId: string,
  pollIntervalMs: number = 2000
): Promise<void> {
  running = true;

  // Reset any tasks stuck in "running" from a previous crash
  const resetCount = await resetStuckTasks();
  if (resetCount > 0) {
    console.log(`[runner] Reset ${resetCount} stuck task(s) to queued`);
  }

  console.log(`[runner] Polling for tasks every ${pollIntervalMs}ms`);

  // Initial poll
  pollAndRun(provider, modelId);

  // Continuous polling
  pollInterval = setInterval(() => pollAndRun(provider, modelId), pollIntervalMs);
}

export function stopRunner() {
  running = false;
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
  }
  console.log("[runner] Stopped");
}
