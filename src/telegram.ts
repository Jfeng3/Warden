import { Bot } from "grammy";
import { insertTask, listActiveTasks, listRecentTasks, getRunningTask, getStepsForTask, findTaskByPrefix, listCronJobs, deleteCronJob } from "./data_model/index.js";
import type { Task, AgentStep } from "./data_model/index.js";
import { markNewSession } from "./session-store.js";

let bot: Bot | null = null;

// ── Telegram Bot ──────────────────────────────────────────

export function startTelegram(): void {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    throw new Error("TELEGRAM_BOT_TOKEN must be set");
  }

  bot = new Bot(token);

  bot.on("message:text", async (ctx) => {
    const chatId = ctx.chat.id;
    const text = ctx.message.text.trim();
    if (!text) return;

    // Handle /new command — reset session for this chat
    if (text === "/new" || text.startsWith("/new@")) {
      markNewSession(`telegram-${chatId}`);
      console.log(`[telegram] Session reset for chat ${chatId}`);
      await ctx.reply("Session reset. Starting fresh.").catch(() => {});
      return;
    }

    // Handle /history command — list recent tasks (all statuses)
    if (text === "/history" || text.startsWith("/history@") || text.startsWith("/history ")) {
      const countStr = text.replace(/^\/history(@\S+)?\s*/, "").trim();
      const count = countStr ? parseInt(countStr, 10) : 3;
      if (isNaN(count) || count < 1) {
        await ctx.reply("Usage: /history [count]");
        return;
      }
      try {
        const tasks = await listRecentTasks(count);
        if (tasks.length === 0) {
          await ctx.reply("No tasks found.");
        } else {
          const lines = tasks.map((t) => {
            const age = formatAge(t.created_at);
            const instr = t.instruction.length > 50 ? t.instruction.slice(0, 47) + "..." : t.instruction;
            return `${t.id.slice(0, 8)}  ${t.status}  ${age}  ${instr}`;
          });
          await ctx.reply(lines.join("\n"));
        }
      } catch (err) {
        await ctx.reply("Failed to list history.").catch(() => {});
      }
      return;
    }

    // Handle /tasks command — list active tasks
    if (text === "/tasks" || text.startsWith("/tasks@")) {
      try {
        const tasks = await listActiveTasks();
        if (tasks.length === 0) {
          await ctx.reply("No active tasks.");
        } else {
          const lines = tasks.map((t) => {
            const age = formatAge(t.created_at);
            const instr = t.instruction.length > 50 ? t.instruction.slice(0, 47) + "..." : t.instruction;
            return `${t.id.slice(0, 8)}  ${t.status}  ${age}  ${instr}`;
          });
          await ctx.reply(lines.join("\n"));
        }
      } catch (err) {
        await ctx.reply("Failed to list tasks.").catch(() => {});
      }
      return;
    }

    // Handle /activeTask command — show running task + tool steps
    if (text === "/activeTask" || text.startsWith("/activeTask@")) {
      try {
        const task = await getRunningTask();
        if (!task) {
          await ctx.reply("No task currently running.");
        } else {
          const msg = await formatTaskDetail(task);
          await ctx.reply(msg);
        }
      } catch (err) {
        await ctx.reply("Failed to get active task.").catch(() => {});
      }
      return;
    }

    // Handle /cronJobs command — list active cron jobs
    if (text === "/cronJobs" || text.startsWith("/cronJobs@")) {
      try {
        const jobs = await listCronJobs(true);
        if (jobs.length === 0) {
          await ctx.reply("No active cron jobs.");
        } else {
          const lines = jobs.map((j) => {
            const schedule = j.schedule_type === "cron" ? j.cron_expression
              : j.schedule_type === "every" ? `every ${j.every_ms}ms`
              : j.at_time ?? "?";
            const instr = j.instruction.length > 50 ? j.instruction.slice(0, 47) + "..." : j.instruction;
            const next = j.next_run_at ? new Date(j.next_run_at).toLocaleString() : "—";
            return `${j.id.slice(0, 8)}  ${j.name}  [${schedule}]  next: ${next}  ${instr}`;
          });
          await ctx.reply(lines.join("\n"));
        }
      } catch (err) {
        await ctx.reply("Failed to list cron jobs.").catch(() => {});
      }
      return;
    }

    // Handle /deleteCron <id> command — delete a cron job by id prefix
    if (text.startsWith("/deleteCron ") || text.startsWith("/deleteCron@")) {
      const idPrefix = text.replace(/^\/deleteCron(@\S+)?\s*/, "").trim();
      if (!idPrefix) {
        await ctx.reply("Usage: /deleteCron <id-prefix>");
        return;
      }
      try {
        const jobs = await listCronJobs();
        const match = jobs.find(j => j.id.startsWith(idPrefix));
        if (!match) {
          await ctx.reply(`No cron job found matching "${idPrefix}".`);
        } else {
          await deleteCronJob(match.id);
          await ctx.reply(`Deleted cron job: ${match.id} (${match.name})`);
        }
      } catch (err) {
        await ctx.reply("Failed to delete cron job.").catch(() => {});
      }
      return;
    }

    // Handle /task <id> command — show task details + tool steps
    if (text.startsWith("/task ") || text.startsWith("/task@")) {
      const idPrefix = text.replace(/^\/task(@\S+)?\s*/, "").trim();
      if (!idPrefix) {
        await ctx.reply("Usage: /task <id-prefix>");
        return;
      }
      try {
        const task = await findTaskByPrefix(idPrefix);
        if (!task) {
          await ctx.reply(`No task found matching "${idPrefix}".`);
        } else {
          const msg = await formatTaskDetail(task);
          await ctx.reply(msg);
        }
      } catch (err) {
        console.error("[telegram] /task error:", err);
        await ctx.reply("Failed to get task.").catch(() => {});
      }
      return;
    }

    try {
      const task = await insertTask({
        instruction: text,
        metadata: { source: "telegram", chatId },
      });
      console.log(`[telegram] Message from ${chatId} → task ${task.id}: "${text.slice(0, 60)}"`);
      await ctx.reply(`Task queued: ${task.id}`);
    } catch (err) {
      console.error("[telegram] Failed to insert task:", err);
      await ctx.reply("Failed to queue task.").catch(() => {});
    }
  });

  bot.catch((err) => {
    console.error("[telegram] Bot error:", err);
  });

  bot.start();
  console.log("[telegram] Bot started (long polling)");
}

export function stopTelegram(): void {
  if (bot) {
    bot.stop();
    console.log("[telegram] Bot stopped");
  }
}

// ── Task completion notification ──────────────────────────

const TELEGRAM_MAX_LENGTH = 4096;

export async function notifyTaskComplete(task: Task): Promise<void> {
  if (!bot || task.metadata?.source !== "telegram" || !task.metadata?.chatId) return;

  const chatId = task.metadata.chatId as number;
  const body = task.status === "done"
    ? task.result || "(no output)"
    : `Task failed: ${task.error || "unknown error"}`;

  const truncated = body.length > TELEGRAM_MAX_LENGTH
    ? body.slice(0, TELEGRAM_MAX_LENGTH - 3) + "..."
    : body;

  try {
    await bot.api.sendMessage(chatId, truncated);
    console.log(`[telegram] Sent reply to chat ${chatId} for task ${task.id}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[telegram] Failed to send reply to chat ${chatId}: ${msg}`);
  }
}

// ── Helpers for task inspection commands ─────────────────

function formatAge(dateStr: string): string {
  const age = Math.round((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (age < 60) return `${age}s`;
  if (age < 3600) return `${Math.floor(age / 60)}m`;
  return `${Math.floor(age / 3600)}h`;
}

async function formatTaskDetail(task: Task): Promise<string> {
  const lines: string[] = [];
  lines.push(`ID: ${task.id}`);
  lines.push(`Status: ${task.status}`);
  lines.push(`Age: ${formatAge(task.created_at)}`);
  lines.push(`Instr: ${task.instruction}`);
  if (task.result) lines.push(`Result: ${task.result.slice(0, 200)}`);
  if (task.error) lines.push(`Error: ${task.error.slice(0, 200)}`);

  const steps = await getStepsForTask(task.id);
  const toolSteps = steps.filter((s) => s.step_type === "tool_start" || s.step_type === "tool_end");
  if (toolSteps.length === 0) {
    lines.push("(no tool invocations yet)");
  } else {
    lines.push(`── Tool invocations (${toolSteps.length} steps) ──`);
    for (const s of toolSteps) {
      const time = new Date(s.created_at).toLocaleTimeString();
      if (s.step_type === "tool_start") {
        const args = s.tool_args ? JSON.stringify(s.tool_args).slice(0, 80) : "";
        lines.push(`${time}  ▶ ${s.tool_name}  ${args}`);
      } else {
        const result = s.tool_result ? s.tool_result.slice(0, 100).replace(/\n/g, "↵") : "";
        const marker = s.is_error ? "✗" : "✓";
        lines.push(`${time}  ${marker} ${s.tool_name}  ${result}`);
      }
    }
  }
  return lines.join("\n");
}

