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
import { getSessionForTask, deriveSessionKey, buildFreshSession } from "./session-store.js";
import { WorkflowState, createStateTools } from "./workflow-state.js";
import type { Task } from "./data_model/index.js";
import { createWriteStream, existsSync, mkdirSync, type WriteStream } from "node:fs";
import path from "node:path";

export interface ParsedInstruction {
  preamble: string;
  steps: { index: number; text: string }[];
}

/**
 * Parse instruction text into ordered steps by STEP N: markers.
 * Returns preamble separately so it can be injected into every step.
 * Instructions without markers are returned as a single step with no preamble.
 */
export function parseSteps(instruction: string): ParsedInstruction {
  const stepPattern = /^STEP\s+(\d+):/gm;
  const matches = [...instruction.matchAll(stepPattern)];
  if (matches.length < 2) return { preamble: "", steps: [{ index: 0, text: instruction }] };

  const preamble = instruction.slice(0, matches[0].index!).trim();

  const steps = matches.map((m, i) => {
    const start = m.index!;
    const end = matches[i + 1]?.index ?? instruction.length;
    return { index: parseInt(m[1]), text: instruction.slice(start, end).trim() };
  });

  return { preamble, steps };
}

const CRON_JOBS_DIR = path.join(process.cwd(), "cron-jobs");

/**
 * Create a write stream to a job-specific log file if the job has a logs/ directory.
 * Returns the stream and a tee() helper that writes to both console and the log file.
 */
function openJobLog(task: Task): { stream: WriteStream | null; tee: typeof console.log; close: () => void } {
  const jobName = task.metadata?.cronJobName as string | undefined;
  if (!jobName) return { stream: null, tee: console.log, close: () => {} };

  const logsDir = path.join(CRON_JOBS_DIR, jobName, "logs");
  if (!existsSync(logsDir)) return { stream: null, tee: console.log, close: () => {} };

  // Create timestamped log file
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const filename = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}.log`;
  const logPath = path.join(logsDir, filename);

  mkdirSync(logsDir, { recursive: true });
  const stream = createWriteStream(logPath, { flags: "a" });
  console.log(`[runner] Job log: ${logPath}`);

  const tee = (...args: unknown[]) => {
    const line = args.map((a) => (typeof a === "string" ? a : JSON.stringify(a))).join(" ");
    console.log(line);
    stream.write(line + "\n");
  };

  const close = () => {
    stream.end();
  };

  return { stream, tee, close };
}

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

function attachSubscriber(session: AgentSession, log: typeof console.log = console.log): void {
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

    // Log tool calls to terminal (and job log if tee'd)
    if (event.type === "tool_execution_start") {
      const toolEvent = event as any;
      const argsStr = toolEvent.args ? JSON.stringify(toolEvent.args, null, 2) : "";
      log(`[runner] [task ${ctx.taskId}] tool_start: ${toolEvent.toolName ?? "unknown"}\n${argsStr}`);
    }
    if (event.type === "tool_execution_end") {
      const toolEvent = event as any;
      const resultStr = typeof toolEvent.result === "string"
        ? toolEvent.result.slice(0, 2000)
        : JSON.stringify(toolEvent.result, null, 2)?.slice(0, 2000) ?? "";
      const prefix = toolEvent.isError ? "tool_error" : "tool_end";
      log(`[runner] [task ${ctx.taskId}] ${prefix}: ${toolEvent.toolName ?? "unknown"}\n${resultStr}`);
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

async function executeTask(task: Task, session: AgentSession, provider: string, modelId: string) {
  console.log(`[runner] Executing task ${task.id}: "${task.instruction.slice(0, 60)}"`);

  const key = deriveSessionKey(task.metadata);
  if (key) {
    console.log(`[runner] Session: ${key} (persistent)`);
  }

  // Expose current task's metadata so cron-cli can auto-inherit it
  if (task.metadata) {
    process.env.WARDEN_TASK_METADATA = JSON.stringify(task.metadata);
  }

  try {
    const { preamble, steps } = parseSteps(task.instruction);
    const isMultiStep = steps.length > 1;
    let result: string;

    if (!isMultiStep) {
      // === SINGLE-STEP: unchanged behavior ===
      const logger = createEventLogger(task.id);
      taskContext.set(session, { taskId: task.id, assistantText: "", logger });
      attachSubscriber(session);

      await session.prompt(steps[0].text);
      const ctx = taskContext.get(session)!;
      result = ctx.assistantText || "(no output)";
      taskContext.delete(session);
    } else {
      // === MULTI-STEP: fresh session per step with workflow state ===
      const { tee, close: closeJobLog } = openJobLog(task);
      const totalSteps = steps.length;
      tee(`[runner] [task ${task.id}] Parsed ${totalSteps} steps (workflow mode)`);

      const workflowState = new WorkflowState();
      // Seed initial state from task metadata (set by cron-task from state.ts)
      const initialState = (task.metadata?.initialState as Record<string, unknown>) ?? {};
      for (const [k, v] of Object.entries(initialState)) {
        workflowState.set(k, v);
      }
      const stateTools = createStateTools(workflowState);
      const stepResults: { index: number; output: string }[] = [];

      try {
        for (let si = 0; si < steps.length; si++) {
          const step = steps[si];
          const stateKeys = Object.keys(workflowState.getAll());
          tee(`[runner] [task ${task.id}] Starting step ${step.index} [${si + 1}/${totalSteps}] (state keys: ${stateKeys.join(", ") || "none"})`);

          // Fresh session with state tools injected
          const stepSession = await buildFreshSession(provider, modelId, stateTools);
          const stepLogger = createEventLogger(task.id);
          taskContext.set(stepSession, { taskId: task.id, assistantText: "", logger: stepLogger });
          attachSubscriber(stepSession, tee);

          // Build full context: preamble + progress + state + step instruction
          const contextParts: string[] = [];

          // Workflow preamble — always present so every step knows the big picture
          if (preamble) contextParts.push(preamble);

          // Step progress — what's done, what's current, what's ahead
          const progressLines: string[] = [];
          for (let j = 0; j < steps.length; j++) {
            const s = steps[j];
            const titleMatch = s.text.match(/^STEP\s+\d+:\s*(.+)/);
            const title = titleMatch ? titleMatch[1].split("\n")[0] : `Step ${s.index}`;
            if (j < si) progressLines.push(`  [done] Step ${s.index}: ${title}`);
            else if (j === si) progressLines.push(`  [current] Step ${s.index}: ${title}`);
            else progressLines.push(`  [ ] Step ${s.index}: ${title}`);
          }
          contextParts.push(`## Workflow Progress (step ${si + 1} of ${totalSteps})\n\n${progressLines.join("\n")}`);

          // Workflow state from prior steps
          const stateContext = workflowState.toContext();
          if (stateContext) contextParts.push(stateContext);

          // The actual step instruction
          contextParts.push(step.text);

          await stepSession.prompt(contextParts.join("\n\n"));

          const ctx = taskContext.get(stepSession)!;
          stepResults.push({ index: step.index, output: ctx.assistantText });

          // Cleanup
          taskContext.delete(stepSession);
          stepSession.dispose();

          tee(`[runner] [task ${task.id}] Step ${step.index} done`);
        }
      } finally {
        closeJobLog();
      }

      result = stepResults.map((s) => `--- STEP ${s.index} ---\n${s.output || "(no output)"}`).join("\n\n");
    }

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
    await executeTask(task, session, taskProvider, taskModel);
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
