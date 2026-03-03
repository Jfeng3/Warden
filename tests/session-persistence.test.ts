/**
 * E2E tests for session persistence and /new reset.
 * Requires: Warden dev server running (`npm run dev 2>&1 | tee log.txt`)
 *
 * Scenarios:
 * 1. Telegram task gets a persistent session (verified via log.txt)
 * 2. Second task from same chatId reuses session and retains context
 * 3. Cron task is stateless (no persistent session)
 * 4. REPL task gets a persistent session
 */
import "dotenv/config";
import { describe, it, after } from "node:test";
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import { insertTask, getTask } from "../src/data_model/index.js";
import { markNewSession } from "../src/session-store.js";

// Use a unique chatId to avoid interference with real Telegram messages
const TEST_CHAT_ID = 9999999001;
const LOG_PATH = "log.txt";

const taskIds: string[] = [];

/** Read log.txt stripping null bytes and control chars that terminal output injects */
function readLog(): string {
  // Use `strings` to extract printable text — handles binary log from `tee`
  return execSync(`strings "${LOG_PATH}"`, { encoding: "utf-8" });
}

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

async function waitForTaskDone(taskId: string, timeoutMs = 120_000): Promise<void> {
  await waitFor(async () => {
    const task = await getTask(taskId);
    return task?.status === "done" || task?.status === "failed";
  }, timeoutMs);
}

describe("session persistence e2e", () => {
  it(
    "telegram task gets a persistent session",
    { timeout: 180_000 },
    async () => {
      const task = await insertTask({
        instruction:
          'Remember the secret code word: FALCON42. Reply with exactly: "Code word noted."',
        metadata: { source: "telegram", chatId: TEST_CHAT_ID },
      });
      taskIds.push(task.id);
      console.log(`[test] Task 1 created: ${task.id}`);

      await waitForTaskDone(task.id);

      const taskResult = await getTask(task.id);
      assert.equal(taskResult?.status, "done", "Task 1 should complete successfully");

      // Verify log shows persistent session for this task
      await waitFor(async () => {
        const log = readLog();
        return log.includes(`Session: telegram-${TEST_CHAT_ID} (persistent)`);
      }, 15_000, 500);

      const log = readLog();
      assert.ok(
        log.includes(`Session: telegram-${TEST_CHAT_ID} (persistent)`),
        `Expected 'Session: telegram-${TEST_CHAT_ID} (persistent)' in log`
      );
    }
  );

  it(
    "second task from same chatId retains conversation context",
    { timeout: 180_000 },
    async () => {
      const task = await insertTask({
        instruction:
          "What secret code word did I tell you to remember? Reply with just the code word, nothing else.",
        metadata: { source: "telegram", chatId: TEST_CHAT_ID },
      });
      taskIds.push(task.id);
      console.log(`[test] Task 2 created: ${task.id}`);

      await waitForTaskDone(task.id);

      const taskResult = await getTask(task.id);
      assert.equal(taskResult?.status, "done", "Task 2 should complete successfully");
      assert.ok(
        taskResult?.result?.includes("FALCON42"),
        `Expected result to contain 'FALCON42', got: "${taskResult?.result?.slice(0, 200)}"`
      );
    }
  );

  it(
    "cron task is stateless (no persistent session)",
    { timeout: 180_000 },
    async () => {
      const task = await insertTask({
        instruction: 'Reply with exactly: "cron task done"',
        metadata: { source: "telegram", chatId: TEST_CHAT_ID, cron: true },
      });
      taskIds.push(task.id);
      console.log(`[test] Cron task created: ${task.id}`);

      await waitForTaskDone(task.id);

      const taskResult = await getTask(task.id);
      assert.equal(taskResult?.status, "done", "Cron task should complete successfully");

      // Wait for log to flush, then check there's no persistent session between
      // "Executing task <id>" and "Task <id> completed" for this cron task
      await new Promise((r) => setTimeout(r, 2000));
      const log = readLog();
      const lines = log.split("\n");

      const execLineIdx = lines.findIndex((l) =>
        l.includes(`Executing task ${task.id}`)
      );
      assert.ok(execLineIdx >= 0, "Should see executing log for cron task");

      // Check lines between executing and completed — should NOT contain "(persistent)"
      const completedIdx = lines.findIndex(
        (l, i) => i > execLineIdx && l.includes(`Task ${task.id} completed`)
      );
      if (completedIdx >= 0) {
        const between = lines.slice(execLineIdx, completedIdx + 1).join("\n");
        assert.ok(
          !between.includes("(persistent)"),
          "Cron task should not have a persistent session"
        );
      }
    }
  );

  it(
    "repl task gets a persistent session",
    { timeout: 180_000 },
    async () => {
      const task = await insertTask({
        instruction: 'Reply with exactly: "repl session active"',
        metadata: { source: "repl" },
      });
      taskIds.push(task.id);
      console.log(`[test] REPL task created: ${task.id}`);

      await waitForTaskDone(task.id);

      const taskResult = await getTask(task.id);
      assert.equal(taskResult?.status, "done", "REPL task should complete successfully");

      // Verify log shows persistent session with key "repl"
      await waitFor(async () => {
        const log = readLog();
        return log.includes("Session: repl (persistent)");
      }, 15_000, 500);

      const log = readLog();
      assert.ok(
        log.includes("Session: repl (persistent)"),
        "Expected 'Session: repl (persistent)' in log"
      );
    }
  );

  it(
    "/new resets telegram session (context lost after reset)",
    { timeout: 180_000 },
    async () => {
      // At this point, the telegram session for TEST_CHAT_ID has FALCON42 in context
      // from tests 1 & 2. Simulate /new by calling markNewSession directly
      // (this is exactly what telegram.ts does when it receives /new).
      markNewSession(`telegram-${TEST_CHAT_ID}`);
      console.log(`[test] Called markNewSession for telegram-${TEST_CHAT_ID}`);

      // Now ask for the code word — should NOT know it since session was reset
      const task = await insertTask({
        instruction:
          'Do you know any secret code word I told you before? Reply with just "yes" or "no".',
        metadata: { source: "telegram", chatId: TEST_CHAT_ID },
      });
      taskIds.push(task.id);
      console.log(`[test] Task (post-reset) created: ${task.id}`);

      await waitForTaskDone(task.id);

      const taskResult = await getTask(task.id);
      assert.equal(taskResult?.status, "done", "Post-reset task should complete successfully");

      // The result should NOT contain FALCON42 — the session was wiped
      const result = taskResult?.result?.toUpperCase() ?? "";
      assert.ok(
        !result.includes("FALCON42"),
        `Expected result to NOT contain 'FALCON42' after /new reset, got: "${taskResult?.result?.slice(0, 200)}"`
      );
    }
  );

  after(async () => {
    console.log(`[test] Created ${taskIds.length} test tasks: ${taskIds.join(", ")}`);
  });
});
