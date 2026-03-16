import { insertTask } from "./data_model/index.js";
import type { CronJob, Task } from "./data_model/index.js";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

const CRON_JOBS_DIR = path.join(process.cwd(), "cron-jobs");

/**
 * Resolve the instruction for a cron job from cron-jobs/<job-name>.md.
 */
function resolveInstruction(job: CronJob): string {
  const filePath = path.join(CRON_JOBS_DIR, `${job.name}.md`);
  if (!existsSync(filePath)) {
    throw new Error(`Instruction file not found: ${filePath}`);
  }
  const content = readFileSync(filePath, "utf-8").trim();
  if (!content) {
    throw new Error(`Instruction file is empty: ${filePath}`);
  }
  console.log(`[cron-task] Loaded instruction from ${filePath}`);
  return content;
}

/**
 * Creates a task from a cron job with consistent metadata.
 * Used by both the automatic scheduler (cron.ts) and manual trigger (cron-cli.ts).
 * Always injects `cron: true` so the runner creates a fresh session.
 */
export async function createCronTask(job: CronJob): Promise<Task> {
  const metadata: Record<string, unknown> = {
    ...(job.task_metadata ?? {}),
    cron: true,
  };
  if (job.publish_mode === "draft") {
    metadata.publish_mode = "draft";
  }
  return insertTask({
    instruction: resolveInstruction(job),
    metadata,
  });
}
