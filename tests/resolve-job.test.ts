import { describe, it, after } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync, rmSync, existsSync } from "node:fs";
import path from "node:path";
import { resolveInstruction, resolveInitialState } from "../src/cron-task.js";
import type { CronJob } from "../src/data_model/index.js";

const TEST_DIR = path.join(process.cwd(), "cron-jobs", "__test-resolve-job__");

function stubJob(name: string): CronJob {
  return {
    id: "test-id",
    name,
    enabled: true,
    schedule_type: "cron",
    cron_expression: "0 9 * * *",
    cron_timezone: "UTC",
    at_time: null,
    every_ms: null,
    task_metadata: null,
    publish_mode: "auto",
    last_run_at: null,
    next_run_at: null,
    last_task_id: null,
    run_count: 0,
    delete_after_run: false,
    created_at: "",
    updated_at: "",
  };
}

describe("resolveInstruction", () => {
  const jobName = "__test-resolve-job__";

  after(() => {
    if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true });
    const flat = path.join(process.cwd(), "cron-jobs", `${jobName}.md`);
    if (existsSync(flat)) rmSync(flat);
  });

  it("resolves folder with instruction.md (single-step)", () => {
    mkdirSync(TEST_DIR, { recursive: true });
    writeFileSync(path.join(TEST_DIR, "instruction.md"), "Do a single thing.");

    const result = resolveInstruction(stubJob(jobName));
    assert.equal(result, "Do a single thing.");
  });

  it("resolves folder with steps/ (multi-step)", () => {
    rmSync(TEST_DIR, { recursive: true });
    const stepsDir = path.join(TEST_DIR, "steps");
    mkdirSync(stepsDir, { recursive: true });

    writeFileSync(path.join(stepsDir, "00-research.md"), "Search for news.");
    writeFileSync(path.join(stepsDir, "01-draft.md"), "Write a blog post.");
    writeFileSync(path.join(stepsDir, "02-publish.md"), "Publish to WordPress.");

    const result = resolveInstruction(stubJob(jobName));
    assert.ok(result.includes("STEP 0: RESEARCH"));
    assert.ok(result.includes("Search for news."));
    assert.ok(result.includes("STEP 1: DRAFT"));
    assert.ok(result.includes("Write a blog post."));
    assert.ok(result.includes("STEP 2: PUBLISH"));
    assert.ok(result.includes("Publish to WordPress."));
  });

  it("prepends workflow.md preamble to multi-step", () => {
    writeFileSync(path.join(TEST_DIR, "workflow.md"), "You are a blog writer.");

    const result = resolveInstruction(stubJob(jobName));
    assert.ok(result.startsWith("You are a blog writer."));
    assert.ok(result.includes("STEP 0: RESEARCH"));
  });

  it("sorts step files by numeric prefix", () => {
    const result = resolveInstruction(stubJob(jobName));
    const researchIdx = result.indexOf("STEP 0: RESEARCH");
    const draftIdx = result.indexOf("STEP 1: DRAFT");
    const publishIdx = result.indexOf("STEP 2: PUBLISH");
    assert.ok(researchIdx < draftIdx);
    assert.ok(draftIdx < publishIdx);
  });

  it("throws for missing job", () => {
    assert.throws(
      () => resolveInstruction(stubJob("nonexistent-job-xyz")),
      /No instruction found/
    );
  });
});

describe("resolveInitialState", () => {
  it("returns defaults from cron-jobs/<name>/state.ts", async () => {
    // daily-blog-publish has a state.ts with draft_dir and publish_dir defaults
    const state = await resolveInitialState(stubJob("daily-blog-publish"));
    assert.equal(state.draft_dir, "/Users/jie/Codes/warden/draft-html");
    assert.equal(state.publish_dir, "/Users/jie/Codes/warden/publish-html");
  });

  it("returns empty object for job with no state.ts", async () => {
    const state = await resolveInitialState(stubJob("nonexistent-job-xyz"));
    assert.deepEqual(state, {});
  });
});
