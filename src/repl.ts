import { createInterface, type Interface } from "node:readline";
import { insertTask, listActiveTasks, listRecentTasks, getRunningTask, getStepsForTask, getTask } from "./data_model/index.js";
import type { Task, AgentStep } from "./data_model/index.js";
import { markNewSession } from "./session-store.js";
import { listSkillNames } from "./skill-tool.js";

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

  console.log("Warden REPL. Tasks are queued to Supabase. /new = reset session, /tasks = list active, /quit = exit.");
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

    if (input === "/skills") {
      const names = listSkillNames();
      console.log(names.length ? `Available skills: ${names.join(", ")}` : "No skills found. Add .md files to skills/");
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

async function findTaskByPrefix(prefix: string): Promise<Task | null> {
  // Try exact match first
  const exact = await getTask(prefix);
  if (exact) return exact;
  // Try prefix match on active tasks
  const active = await listActiveTasks();
  const match = active.find(t => t.id.startsWith(prefix));
  return match ?? null;
}
