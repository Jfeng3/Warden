import type { AgentSession } from "@mariozechner/pi-coding-agent";
import {
  pollNextTask,
  claimTask,
  completeTask,
  failTask,
  failStuckTasks,
  upsertConversationHistory,
} from "./data_model/index.js";
import { createEventLogger } from "./logger.js";
import { reprompt } from "./repl.js";
import { notifyTaskComplete } from "./telegram.js";
import { getSessionForTask, deriveSessionKey } from "./session-store.js";
import type { Task } from "./data_model/index.js";

let running = false;
let pollInterval: ReturnType<typeof setInterval> | null = null;
let executing = false; // Guard against concurrent task execution

// Track which sessions already have a subscriber attached
const subscribedSessions = new WeakSet<AgentSession>();

// Track per-task context on the session so the subscriber can reference it
interface TaskCtx {
  taskId: string;
  assistantText: string;
  logger: { log: (event: Record<string, unknown>) => void };
}
const taskContext = new WeakMap<AgentSession, TaskCtx>();

function attachSubscriber(session: AgentSession): void {
  if (subscribedSessions.has(session)) return;
  subscribedSessions.add(session);

  session.subscribe((event) => {
    const ctx = taskContext.get(session);
    if (!ctx) return;

    // Log to Supabase
    ctx.logger.log(event as Record<string, unknown>);

    // Collect text output
    if (event.type === "message_update") {
      const msgEvent = (event as any).assistantMessageEvent as
        | { type: string; delta?: string }
        | undefined;
      if (msgEvent?.type === "text_delta" && msgEvent.delta) {
        ctx.assistantText += msgEvent.delta;
      }
    }

    // Log tool calls to terminal
    if (event.type === "tool_execution_start") {
      const toolEvent = event as any;
      const argsStr = toolEvent.args ? JSON.stringify(toolEvent.args, null, 2) : "";
      console.log(`[runner] [task ${ctx.taskId}] tool_start: ${toolEvent.toolName ?? "unknown"}\n${argsStr}`);
    }
    if (event.type === "tool_execution_end") {
      const toolEvent = event as any;
      const resultStr = typeof toolEvent.result === "string"
        ? toolEvent.result.slice(0, 2000)
        : JSON.stringify(toolEvent.result, null, 2)?.slice(0, 2000) ?? "";
      const prefix = toolEvent.isError ? "tool_error" : "tool_end";
      console.log(`[runner] [task ${ctx.taskId}] ${prefix}: ${toolEvent.toolName ?? "unknown"}\n${resultStr}`);
    }

    // Save conversation history on turn_end
    if (event.type === "turn_end") {
      const messages = session.messages;
      if (messages) {
        upsertConversationHistory(ctx.taskId, messages).catch((err) => {
          console.error(`[runner] Failed to save conversation history:`, err);
        });
      }
    }
  });
}

async function executeTask(task: Task, session: AgentSession) {
  console.log(`[runner] Executing task ${task.id}: "${task.instruction.slice(0, 60)}"`);

  const key = deriveSessionKey(task.metadata);
  if (key) {
    console.log(`[runner] Session: ${key} (persistent)`);
  }

  // Set per-task context for the subscriber
  const logger = createEventLogger(task.id);
  taskContext.set(session, { taskId: task.id, assistantText: "", logger });

  // Attach subscriber (idempotent for cached sessions)
  attachSubscriber(session);

  // Expose current task's metadata so cron-cli can auto-inherit it
  if (task.metadata) {
    process.env.WARDEN_TASK_METADATA = JSON.stringify(task.metadata);
  }

  try {
    await session.prompt(task.instruction);
    const ctx = taskContext.get(session)!;
    const result = ctx.assistantText || "(no output)";
    await completeTask(task.id, result);
    console.log(`[runner] Task ${task.id} completed\n${result}`);
    if (result === "(no output)") {
      await notifyTaskComplete({
        ...task,
        status: "failed",
        error: `Task completed but produced no output. The agent may have run out of context or hit connection errors. Task ID: ${task.id}`,
      });
    } else {
      await notifyTaskComplete({ ...task, status: "done", result });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[runner] Task ${task.id} failed:`, msg);
    await failTask(task.id, msg);
    await notifyTaskComplete({ ...task, status: "failed", error: msg });
  } finally {
    taskContext.delete(session);
    delete process.env.WARDEN_TASK_METADATA;
    reprompt();
  }
}

async function pollAndRun(provider: string, modelId: string) {
  if (!running || executing) return;

  let claimedTaskId: string | null = null;
  executing = true;

  try {
    const task = await pollNextTask();
    if (!task) return;

    const claimed = await claimTask(task.id);
    if (!claimed) return; // Another runner got it
    claimedTaskId = task.id;

    // Per-task model override via metadata (e.g. metadata.provider / metadata.model)
    const taskProvider = (task.metadata?.provider as string) || provider;
    const taskModel = (task.metadata?.model as string) || modelId;
    const session = await getSessionForTask(task, taskProvider, taskModel);
    await executeTask(task, session);
  } catch (err) {
    console.error(`[runner] Poll error:`, err);
    // If we claimed a task but session creation failed, mark it failed
    if (claimedTaskId) {
      const msg = err instanceof Error ? err.message : String(err);
      await failTask(claimedTaskId, msg).catch(() => {});
    }
  } finally {
    executing = false;
  }
}

export async function startRunner(
  provider: string,
  modelId: string,
  pollIntervalMs: number = 2000
): Promise<void> {
  running = true;

  // Mark any tasks stuck in "running" as failed (from a previous crash)
  const failedCount = await failStuckTasks();
  if (failedCount > 0) {
    console.log(`[runner] Marked ${failedCount} stuck task(s) as failed`);
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
