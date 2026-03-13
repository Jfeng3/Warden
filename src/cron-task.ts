import { insertTask } from "./data_model/index.js";
import type { CronJob, Task } from "./data_model/index.js";

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
    instruction: job.instruction,
    metadata,
  });
}
