import { createInterface, type Interface } from "node:readline";
import { insertTask, listActiveTasks, listRecentTasks, getRunningTask, getStepsForTask, findTaskByPrefix, listCronJobs, deleteCronJob } from "./data_model/index.js";
import type { Task, AgentStep } from "./data_model/index.js";
import type { AgentSession } from "@mariozechner/pi-coding-agent";
import { markNewSession, getCachedSession } from "./session-store.js";
import { resolveModel } from "./config.js";
import { listSkillNames, getSkillContent } from "./skill-tool.js";

let rl: Interface | null = null;

export function reprompt() {
  try {
    if (rl) rl.prompt();
  } catch {
    // readline may be closed (e.g. no stdin in background mode)
  }
}

export function startRepl() {
  rl = createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: "warden> ",
  });

  console.log("Warden REPL. /new = reset, /context = show context, /tasks = active, /cronJobs = cron, /quit = exit.");
  rl.prompt();

  rl.on("line", async (line) => {
    const input = line.trim();
    if (!input) {
      rl!.prompt();
      return;
    }

    if (input === "/quit" || input === "/exit") {
      console.log("Goodbye.");
      rl!.close();
      process.exit(0);
    }

    if (input === "/new") {
      markNewSession("repl");
      console.log("Session reset. Starting fresh.");
      rl!.prompt();
      return;
    }

    if (input === "/tasks") {
      try {
        const tasks = await listActiveTasks();
        if (tasks.length === 0) {
          console.log("No active tasks.");
        } else {
          for (const t of tasks) {
            const age = Math.round((Date.now() - new Date(t.created_at).getTime()) / 1000);
            const ageStr = age < 60 ? `${age}s` : age < 3600 ? `${Math.floor(age / 60)}m` : `${Math.floor(age / 3600)}h`;
            const instr = t.instruction.length > 60 ? t.instruction.slice(0, 57) + "..." : t.instruction;
            console.log(`  ${t.id.slice(0, 8)}  ${t.status.padEnd(7)}  ${ageStr.padStart(4)}  ${instr}`);
          }
        }
      } catch (err) {
        console.error("Failed to list tasks:", err);
      }
      rl!.prompt();
      return;
    }

    if (input === "/history" || input.startsWith("/history ")) {
      const countStr = input.slice(8).trim();
      const count = countStr ? parseInt(countStr, 10) : 3;
      if (isNaN(count) || count < 1) {
        console.log("Usage: /history [count]");
        rl!.prompt();
        return;
      }
      try {
        const tasks = await listRecentTasks(count);
        if (tasks.length === 0) {
          console.log("No tasks found.");
        } else {
          for (const t of tasks) {
            const age = formatAge(t.created_at);
            const instr = t.instruction.length > 50 ? t.instruction.slice(0, 47) + "..." : t.instruction;
            console.log(`  ${t.id.slice(0, 8)}  ${t.status.padEnd(7)}  ${age.padStart(4)}  ${instr}`);
          }
        }
      } catch (err) {
        console.error("Failed to list history:", err);
      }
      rl!.prompt();
      return;
    }

    if (input === "/activeTask") {
      try {
        const task = await getRunningTask();
        if (!task) {
          console.log("No task currently running.");
        } else {
          printTaskDetail(task);
          await printTaskSteps(task.id);
        }
      } catch (err) {
        console.error("Failed to get active task:", err);
      }
      rl!.prompt();
      return;
    }

    if (input.startsWith("/task ")) {
      const idPrefix = input.slice(6).trim();
      if (!idPrefix) {
        console.log("Usage: /task <id-prefix>");
        rl!.prompt();
        return;
      }
      try {
        const task = await findTaskByPrefix(idPrefix);
        if (!task) {
          console.log(`No task found matching "${idPrefix}".`);
        } else {
          printTaskDetail(task);
          await printTaskSteps(task.id);
        }
      } catch (err) {
        console.error("Failed to get task:", err);
      }
      rl!.prompt();
      return;
    }

    if (input === "/cronJobs") {
      try {
        const jobs = await listCronJobs(true);
        if (jobs.length === 0) {
          console.log("No active cron jobs.");
        } else {
          for (const j of jobs) {
            const schedule = j.schedule_type === "cron" ? j.cron_expression
              : j.schedule_type === "every" ? `every ${j.every_ms}ms`
              : j.at_time ?? "?";
            const next = j.next_run_at ? new Date(j.next_run_at).toLocaleString() : "—";
            console.log(`  ${j.id.slice(0, 8)}  ${j.name}  [${schedule}]  next: ${next}`);
          }
        }
      } catch (err) {
        console.error("Failed to list cron jobs:", err);
      }
      rl!.prompt();
      return;
    }

    if (input.startsWith("/deleteCron ")) {
      const idPrefix = input.slice(12).trim();
      if (!idPrefix) {
        console.log("Usage: /deleteCron <id-prefix>");
        rl!.prompt();
        return;
      }
      try {
        const jobs = await listCronJobs();
        const match = jobs.find(j => j.id.startsWith(idPrefix));
        if (!match) {
          console.log(`No cron job found matching "${idPrefix}".`);
        } else {
          await deleteCronJob(match.id);
          console.log(`Deleted cron job: ${match.id} (${match.name})`);
        }
      } catch (err) {
        console.error("Failed to delete cron job:", err);
      }
      rl!.prompt();
      return;
    }

    if (input === "/context") {
      const session = getCachedSession("repl");
      if (!session) {
        console.log("No active session. Send a message first to create one.");
      } else {
        printContext(session);
      }
      rl!.prompt();
      return;
    }

    if (input === "/skills") {
      const names = listSkillNames();
      console.log(names.length ? `Available skills: ${names.join(", ")}` : "No skills found. Add .md files to skills/");
      rl!.prompt();
      return;
    }

    if (input.startsWith("/skill ")) {
      const rest = input.slice(7).trim();
      const spaceIdx = rest.indexOf(" ");
      const skillName = spaceIdx > 0 ? rest.slice(0, spaceIdx) : rest;
      const args = spaceIdx > 0 ? rest.slice(spaceIdx + 1).trim() : "";

      const content = getSkillContent(skillName);
      if (!content) {
        console.log(`Unknown skill "${skillName}". Use /skills to list available skills.`);
        rl!.prompt();
        return;
      }

      const instruction = args
        ? `Use the following skill guide:\n\n${content}\n\n## User Request\n\n${args}`
        : `Use the following skill guide:\n\n${content}`;

      try {
        const task = await insertTask({ instruction, metadata: { source: "repl" } });
        console.log(`Task queued (skill: ${skillName}): ${task.id}`);
      } catch (err) {
        console.error("Failed to queue task:", err);
      }
      rl!.prompt();
      return;
    }

    try {
      const task = await insertTask({ instruction: input, metadata: { source: "repl" } });
      console.log(`Task queued: ${task.id}`);
    } catch (err) {
      console.error("Failed to queue task:", err);
    }
    rl!.prompt();
  });

  rl.on("SIGINT", () => {
    console.log("\nGoodbye.");
    process.exit(0);
  });
}

function formatAge(dateStr: string): string {
  const age = Math.round((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (age < 60) return `${age}s`;
  if (age < 3600) return `${Math.floor(age / 60)}m`;
  return `${Math.floor(age / 3600)}h`;
}

function printTaskDetail(task: Task) {
  console.log(`  ID:      ${task.id}`);
  console.log(`  Status:  ${task.status}`);
  console.log(`  Age:     ${formatAge(task.created_at)}`);
  console.log(`  Instr:   ${task.instruction}`);
  if (task.result) console.log(`  Result:  ${task.result.slice(0, 200)}`);
  if (task.error) console.log(`  Error:   ${task.error.slice(0, 200)}`);
}

function printContext(session: AgentSession) {
  const state = session.state;
  const messages = state.messages;

  console.log("── Agent Context ──");
  console.log(`  Model:    ${state.model?.id ?? "unknown"}`);
  console.log(`  Provider: ${state.model?.provider ?? "unknown"}`);
  console.log(`  Tools:    ${state.tools.map(t => t.name).join(", ")}`);
  console.log(`  Messages: ${messages.length}`);
  console.log(`  System prompt: ${state.systemPrompt.length} chars`);
  console.log("");

  if (messages.length === 0) {
    console.log("  (no messages yet)");
    return;
  }

  // Estimate token count (~4 chars per token)
  const totalChars = messages.reduce((sum, m) => {
    return sum + JSON.stringify(m).length;
  }, 0) + state.systemPrompt.length;
  console.log(`  Estimated context size: ~${Math.round(totalChars / 4)} tokens (${totalChars} chars)`);
  console.log("");

  for (let i = 0; i < messages.length; i++) {
    const m = messages[i];
    if (!("role" in m)) {
      console.log(`  [${i}] custom message`);
      continue;
    }
    const role = m.role;
    if (role === "user") {
      const content = typeof m.content === "string" ? m.content : JSON.stringify(m.content);
      const preview = content.length > 120 ? content.slice(0, 117) + "..." : content;
      console.log(`  [${i}] user: ${preview}`);
    } else if (role === "assistant") {
      const textParts = m.content.filter((c: any) => c.type === "text");
      const toolCalls = m.content.filter((c: any) => c.type === "tool_call");
      const textPreview = textParts.map((c: any) => c.text || "").join("").slice(0, 120);
      const suffix = toolCalls.length > 0 ? ` [+${toolCalls.length} tool calls]` : "";
      console.log(`  [${i}] assistant: ${textPreview ? textPreview + "..." : "(no text)"}${suffix}`);
    } else if (role === "toolResult") {
      const name = (m as any).toolName || (m as any).toolCallId || "?";
      console.log(`  [${i}] toolResult: ${name}`);
    } else {
      console.log(`  [${i}] ${role}`);
    }
  }
}

async function printTaskSteps(taskId: string) {
  const steps = await getStepsForTask(taskId);
  const toolSteps = steps.filter(s => s.step_type === "tool_start" || s.step_type === "tool_end");
  if (toolSteps.length === 0) {
    console.log("  (no tool invocations yet)");
    return;
  }
  console.log(`  ── Tool invocations (${toolSteps.length} steps) ──`);
  for (const s of toolSteps) {
    const time = new Date(s.created_at).toLocaleTimeString();
    if (s.step_type === "tool_start") {
      const args = s.tool_args ? JSON.stringify(s.tool_args).slice(0, 80) : "";
      console.log(`  ${time}  ▶ ${s.tool_name}  ${args}`);
    } else {
      const result = s.tool_result ? s.tool_result.slice(0, 100).replace(/\n/g, "↵") : "";
      const marker = s.is_error ? "✗" : "✓";
      console.log(`  ${time}  ${marker} ${s.tool_name}  ${result}`);
    }
  }
}

