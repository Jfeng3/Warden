#!/usr/bin/env node
import "dotenv/config";
import { parseArgs } from "node:util";
import {
  insertCronJob,
  getCronJob,
  listCronJobs,
  updateCronJob,
  deleteCronJob,
  insertTask,
} from "./data_model/index.js";
import type { CronJobInput, CronJobUpdate } from "./data_model/index.js";
import { computeNextRun, parseInterval, validateCronExpression } from "./cron-utils.js";
import type { CronJob } from "./data_model/index.js";

function usage(): never {
  console.log(`Usage: npx tsx src/cron-cli.ts <command> [options]

Commands:
  add       Create a new cron job
  list      List cron jobs
  get <id>  Show details of a cron job
  update <id>  Update a cron job
  remove <id>  Delete a cron job
  run <id>     Manually trigger a cron job now

Add/Update options:
  --name <name>           Job name
  --cron <expression>     Cron expression (e.g. "0 9 * * *")
  --at <ISO datetime>     One-shot time (e.g. "2025-01-15T09:00:00Z")
  --every <interval>      Repeat interval (e.g. "30s", "5m", "2h", "1d")
  --instruction <text>    Task instruction to run
  --tz <timezone>         IANA timezone (default: UTC)
  --metadata <json>       Task metadata JSON (e.g. '{"source":"telegram","chatId":123}')
  --delete-after-run      Delete job after it runs (one-shot)
  --enable                Enable the job
  --disable               Disable the job

List options:
  --enabled-only          Only show enabled jobs
  --json                  Output as JSON`);
  process.exit(1);
}

async function cmdAdd(args: string[]): Promise<void> {
  const { values } = parseArgs({
    args,
    options: {
      name: { type: "string" },
      cron: { type: "string" },
      at: { type: "string" },
      every: { type: "string" },
      instruction: { type: "string" },
      tz: { type: "string" },
      metadata: { type: "string" },
      "delete-after-run": { type: "boolean", default: false },
    },
    strict: true,
  });

  if (!values.name) { console.error("Error: --name is required"); process.exit(1); }
  if (!values.instruction) { console.error("Error: --instruction is required"); process.exit(1); }

  const scheduleCount = [values.cron, values.at, values.every].filter(Boolean).length;
  if (scheduleCount !== 1) {
    console.error("Error: exactly one of --cron, --at, or --every is required");
    process.exit(1);
  }

  const input: CronJobInput = {
    name: values.name,
    instruction: values.instruction,
    schedule_type: values.cron ? "cron" : values.at ? "at" : "every",
    delete_after_run: values["delete-after-run"],
  };

  if (values.cron) {
    if (!validateCronExpression(values.cron)) {
      console.error(`Error: invalid cron expression "${values.cron}"`);
      process.exit(1);
    }
    input.cron_expression = values.cron;
  }
  if (values.at) {
    const atDate = new Date(values.at);
    if (isNaN(atDate.getTime())) {
      console.error(`Error: invalid date "${values.at}"`);
      process.exit(1);
    }
    input.at_time = atDate.toISOString();
    input.delete_after_run = values["delete-after-run"] ?? true; // default true for one-shot
  }
  if (values.every) {
    input.every_ms = parseInterval(values.every);
  }
  if (values.tz) input.cron_timezone = values.tz;
  if (values.metadata) {
    try {
      input.task_metadata = JSON.parse(values.metadata);
    } catch {
      console.error("Error: --metadata must be valid JSON");
      process.exit(1);
    }
  }

  // Auto-inherit metadata from parent task (e.g. Telegram source)
  if (!input.task_metadata && process.env.WARDEN_TASK_METADATA) {
    try {
      input.task_metadata = JSON.parse(process.env.WARDEN_TASK_METADATA);
    } catch { /* ignore malformed env */ }
  }

  // Compute initial next_run_at
  const stubJob = { ...input, id: "", enabled: true, last_run_at: null, next_run_at: null, last_task_id: null, run_count: 0, created_at: "", updated_at: "", cron_expression: input.cron_expression ?? null, at_time: input.at_time ?? null, every_ms: input.every_ms ?? null, cron_timezone: input.cron_timezone ?? "UTC", task_metadata: input.task_metadata ?? null, delete_after_run: input.delete_after_run ?? false } as CronJob;
  input.next_run_at = computeNextRun(stubJob) ?? undefined;

  const job = await insertCronJob(input);
  console.log(`Created cron job: ${job.id}`);
  console.log(`  Name: ${job.name}`);
  console.log(`  Schedule: ${job.schedule_type} ${job.cron_expression || job.at_time || job.every_ms + "ms"}`);
  console.log(`  Next run: ${job.next_run_at || "none"}`);
}

async function cmdList(args: string[]): Promise<void> {
  const { values } = parseArgs({
    args,
    options: {
      "enabled-only": { type: "boolean", default: false },
      json: { type: "boolean", default: false },
    },
    strict: true,
  });

  const jobs = await listCronJobs(values["enabled-only"]);

  if (values.json) {
    console.log(JSON.stringify(jobs, null, 2));
    return;
  }

  if (jobs.length === 0) {
    console.log("No cron jobs found.");
    return;
  }

  for (const job of jobs) {
    const schedule = job.cron_expression || job.at_time || (job.every_ms ? `every ${job.every_ms}ms` : "unknown");
    const status = job.enabled ? "enabled" : "disabled";
    console.log(`${job.id}  ${job.name}  [${job.schedule_type}: ${schedule}]  ${status}  next: ${job.next_run_at || "none"}  runs: ${job.run_count}`);
  }
}

async function cmdGet(args: string[]): Promise<void> {
  const id = args[0];
  if (!id) { console.error("Error: job ID required"); process.exit(1); }
  const job = await getCronJob(id);
  if (!job) { console.error(`Job ${id} not found`); process.exit(1); }
  console.log(JSON.stringify(job, null, 2));
}

async function cmdUpdate(args: string[]): Promise<void> {
  const id = args[0];
  if (!id) { console.error("Error: job ID required"); process.exit(1); }

  const { values } = parseArgs({
    args: args.slice(1),
    options: {
      name: { type: "string" },
      cron: { type: "string" },
      at: { type: "string" },
      every: { type: "string" },
      instruction: { type: "string" },
      tz: { type: "string" },
      metadata: { type: "string" },
      "delete-after-run": { type: "boolean" },
      enable: { type: "boolean" },
      disable: { type: "boolean" },
    },
    strict: true,
  });

  const updates: CronJobUpdate = {};
  if (values.name) updates.name = values.name;
  if (values.instruction) updates.instruction = values.instruction;
  if (values.enable) updates.enabled = true;
  if (values.disable) updates.enabled = false;
  if (values.tz) updates.cron_timezone = values.tz;
  if (values["delete-after-run"] !== undefined) updates.delete_after_run = values["delete-after-run"];
  if (values.metadata) {
    try { updates.task_metadata = JSON.parse(values.metadata); }
    catch { console.error("Error: --metadata must be valid JSON"); process.exit(1); }
  }

  // Auto-inherit metadata from parent task if --metadata wasn't explicitly passed
  if (!values.metadata && !updates.task_metadata && process.env.WARDEN_TASK_METADATA) {
    try {
      updates.task_metadata = JSON.parse(process.env.WARDEN_TASK_METADATA);
    } catch { /* ignore malformed env */ }
  }

  if (values.cron) {
    if (!validateCronExpression(values.cron)) {
      console.error(`Error: invalid cron expression "${values.cron}"`);
      process.exit(1);
    }
    updates.schedule_type = "cron";
    updates.cron_expression = values.cron;
  } else if (values.at) {
    const atDate = new Date(values.at);
    if (isNaN(atDate.getTime())) { console.error(`Error: invalid date "${values.at}"`); process.exit(1); }
    updates.schedule_type = "at";
    updates.at_time = atDate.toISOString();
  } else if (values.every) {
    updates.schedule_type = "every";
    updates.every_ms = parseInterval(values.every);
  }

  // Recompute next_run_at if schedule changed
  if (updates.schedule_type) {
    const existing = await getCronJob(id);
    if (!existing) { console.error(`Job ${id} not found`); process.exit(1); }
    const merged = { ...existing, ...updates } as CronJob;
    updates.next_run_at = computeNextRun(merged) ?? undefined;
  }

  const job = await updateCronJob(id, updates);
  console.log(`Updated cron job: ${job.id}`);
  console.log(JSON.stringify(job, null, 2));
}

async function cmdRemove(args: string[]): Promise<void> {
  const id = args[0];
  if (!id) { console.error("Error: job ID required"); process.exit(1); }
  await deleteCronJob(id);
  console.log(`Deleted cron job: ${id}`);
}

async function cmdRun(args: string[]): Promise<void> {
  const id = args[0];
  if (!id) { console.error("Error: job ID required"); process.exit(1); }
  const job = await getCronJob(id);
  if (!job) { console.error(`Job ${id} not found`); process.exit(1); }

  const task = await insertTask({
    instruction: job.instruction,
    metadata: job.task_metadata ?? undefined,
  });
  console.log(`Triggered cron job "${job.name}" → task ${task.id}`);
}

// ── Main ──────────────────────────────────────────────────

const command = process.argv[2];
const rest = process.argv.slice(3);

switch (command) {
  case "add": await cmdAdd(rest); break;
  case "list": await cmdList(rest); break;
  case "get": await cmdGet(rest); break;
  case "update": await cmdUpdate(rest); break;
  case "remove": await cmdRemove(rest); break;
  case "run": await cmdRun(rest); break;
  default: usage();
}
