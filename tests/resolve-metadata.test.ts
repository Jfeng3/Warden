/**
 * E2E tests for metadata inheritance in cron jobs.
 * Requires: Warden dev server running (`npm run dev 2>&1 | tee log.txt`)
 *
 * Scenarios:
 * 1. cron-cli add with WARDEN_TASK_METADATA env → cron job inherits metadata
 * 2. Manually fired cron task → task inherits metadata from cron job
 * 3. Warden completes fired task → result routes to Telegram (verified via log.txt)
 */
import "dotenv/config";
import { describe, it, after } from "node:test";
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { getCronJob, getTask, deleteCronJob } from "../src/data_model/index.js";

const TELEGRAM_METADATA = { source: "telegram", chatId: 7823756809 };
const LOG_PATH = "log.txt";

async function waitFor(
  fn: () => Promise<boolean>,
  timeoutMs: number,
  intervalMs = 2000
): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await fn()) return;
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error(`Timed out after ${timeoutMs}ms`);
}

describe("metadata inheritance e2e", () => {
  let cronJobId: string;
  let firedTaskId: string;
  const logLinesBefore = readFileSync(LOG_PATH, "utf-8").split("\n").length;

  it("cron-cli add inherits WARDEN_TASK_METADATA into cron job", async () => {
    const futureTime = new Date(Date.now() + 86_400_000).toISOString();
    const output = execSync(
      `npx tsx src/cron-cli.ts add --name "e2e-metadata-test" --at "${futureTime}" --instruction "Reply with exactly: Your scheduled reminder has arrived." --delete-after-run`,
      {
        env: {
          ...process.env,
          WARDEN_TASK_METADATA: JSON.stringify(TELEGRAM_METADATA),
        },
        encoding: "utf-8",
      }
    );

    const match = output.match(/Created cron job: (\S+)/);
    assert.ok(match, `Expected 'Created cron job: <id>' in output, got: ${output}`);
    cronJobId = match![1];

    const job = await getCronJob(cronJobId);
    assert.ok(job, "Cron job should exist in DB");
    assert.deepEqual(
      job!.task_metadata,
      TELEGRAM_METADATA,
      "Cron job should inherit metadata from WARDEN_TASK_METADATA env"
    );
  });

  it("manually fired cron task inherits metadata from cron job", async () => {
    const output = execSync(`npx tsx src/cron-cli.ts run ${cronJobId}`, {
      encoding: "utf-8",
    });

    const match = output.match(/→ task (\S+)/);
    assert.ok(match, `Expected '→ task <id>' in output, got: ${output}`);
    firedTaskId = match![1];

    const task = await getTask(firedTaskId);
    assert.ok(task, "Fired task should exist in DB");
    assert.deepEqual(
      task!.metadata,
      TELEGRAM_METADATA,
      "Fired task should have metadata inherited from cron job"
    );
  });

  it("completed task routes result to Telegram", { timeout: 180_000 }, async () => {
    // Wait for Warden to finish the task
    await waitFor(async () => {
      const task = await getTask(firedTaskId);
      return task?.status === "done" || task?.status === "failed";
    }, 120_000);

    // Wait for the telegram delivery line to be flushed to log.txt
    await waitFor(async () => {
      const log = readFileSync(LOG_PATH, "utf-8");
      return log.includes(
        `[telegram] Sent reply to chat ${TELEGRAM_METADATA.chatId} for task ${firedTaskId}`
      );
    }, 15_000, 500);

    const logContent = readFileSync(LOG_PATH, "utf-8");
    const telegramLine = logContent
      .split("\n")
      .find(
        (l) =>
          l.includes(
            `[telegram] Sent reply to chat ${TELEGRAM_METADATA.chatId}`
          ) && l.includes(firedTaskId)
      );

    assert.ok(
      telegramLine,
      `Expected '[telegram] Sent reply to chat ${TELEGRAM_METADATA.chatId} for task ${firedTaskId}' in log.txt`
    );
  });

  after(async () => {
    if (cronJobId) {
      try {
        await deleteCronJob(cronJobId);
      } catch {}
    }
  });
});
