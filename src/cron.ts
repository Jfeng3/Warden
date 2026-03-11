import {
  pollDueCronJobs,
  insertTask,
  markCronJobRun,
  updateCronJob,
  deleteCronJob,
} from "./data_model/index.js";
import { computeNextRun } from "./cron-utils.js";

let running = false;
let pollInterval: ReturnType<typeof setInterval> | null = null;

const POLL_INTERVAL_MS = 30_000; // 30 seconds

async function fireDueJobs(): Promise<void> {
  if (!running) return;

  try {
    const dueJobs = await pollDueCronJobs();
    for (const job of dueJobs) {
      try {
        // Create a task from the cron job
        // Inject publish_mode into metadata so the agent knows whether to publish or draft
        const metadata: Record<string, unknown> = {
          ...(job.task_metadata ?? {}),
          cron: true,
        };
        if (job.publish_mode === "draft") {
          metadata.publish_mode = "draft";
        }
        const task = await insertTask({
          instruction: job.instruction,
          metadata,
        });
        console.log(`[cron] Fired job "${job.name}" (${job.id}) → task ${task.id}`);

        // Compute next run time
        const nextRun = computeNextRun(job);

        // Update the job's run tracking
        await markCronJobRun(job.id, task.id, nextRun);

        // Handle one-shot jobs
        if (job.schedule_type === "at" || !nextRun) {
          if (job.delete_after_run) {
            await deleteCronJob(job.id);
            console.log(`[cron] Deleted one-shot job "${job.name}" (${job.id})`);
          } else {
            await updateCronJob(job.id, { enabled: false });
            console.log(`[cron] Disabled one-shot job "${job.name}" (${job.id})`);
          }
        }
      } catch (err) {
        console.error(`[cron] Error firing job ${job.id}:`, err);
      }
    }
  } catch (err) {
    console.error("[cron] Poll error:", err);
  }
}

export function startCron(): void {
  running = true;
  console.log(`[cron] Scheduler started (polling every ${POLL_INTERVAL_MS / 1000}s)`);

  // Initial poll
  fireDueJobs();

  // Continuous polling
  pollInterval = setInterval(fireDueJobs, POLL_INTERVAL_MS);
}

export function stopCron(): void {
  running = false;
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
  }
  console.log("[cron] Scheduler stopped");
}
