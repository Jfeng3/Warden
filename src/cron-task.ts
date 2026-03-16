import { insertTask } from "./data_model/index.js";
import type { CronJob, Task } from "./data_model/index.js";
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { tsImport } from "tsx/esm/api";

const CRON_JOBS_DIR = path.join(process.cwd(), "cron-jobs");

/**
 * Resolve the instruction for a cron job.
 *
 * Resolution order:
 * 1. cron-jobs/<name>.md  (flat file — backwards compat)
 * 2. cron-jobs/<name>/steps/  (folder with step files → multi-step workflow)
 * 3. cron-jobs/<name>/instruction.md  (folder with single instruction)
 */
export function resolveInstruction(job: CronJob): string {
  // 1. Flat file
  const flatFile = path.join(CRON_JOBS_DIR, `${job.name}.md`);
  if (existsSync(flatFile) && statSync(flatFile).isFile()) {
    const content = readFileSync(flatFile, "utf-8").trim();
    if (!content) throw new Error(`Instruction file is empty: ${flatFile}`);
    console.log(`[cron-task] Loaded instruction from ${flatFile}`);
    return content;
  }

  // 2-3. Folder
  const jobDir = path.join(CRON_JOBS_DIR, job.name);
  if (!existsSync(jobDir) || !statSync(jobDir).isDirectory()) {
    throw new Error(`No instruction found for job "${job.name}": expected ${flatFile} or ${jobDir}/`);
  }

  const stepsDir = path.join(jobDir, "steps");
  if (existsSync(stepsDir) && statSync(stepsDir).isDirectory()) {
    return resolveMultiStep(jobDir, stepsDir);
  }

  // Single instruction in folder
  const instrFile = path.join(jobDir, "instruction.md");
  if (!existsSync(instrFile)) {
    throw new Error(`No instruction.md or steps/ found in ${jobDir}/`);
  }
  const content = readFileSync(instrFile, "utf-8").trim();
  if (!content) throw new Error(`Instruction file is empty: ${instrFile}`);
  console.log(`[cron-task] Loaded instruction from ${instrFile}`);
  return content;
}

/**
 * Read step files from steps/ dir, compose into STEP N: marked instruction.
 * Optionally prepend workflow.md preamble.
 */
function resolveMultiStep(jobDir: string, stepsDir: string): string {
  // Read step files sorted by numeric prefix
  const files = readdirSync(stepsDir)
    .filter((f) => f.endsWith(".md"))
    .sort();

  if (files.length === 0) {
    throw new Error(`No .md step files found in ${stepsDir}/`);
  }

  // Optional preamble
  const preambleFile = path.join(jobDir, "workflow.md");
  let preamble = "";
  if (existsSync(preambleFile)) {
    preamble = readFileSync(preambleFile, "utf-8").trim();
  }

  // Compose steps with STEP N: markers
  const parts: string[] = [];
  if (preamble) parts.push(preamble);

  for (let i = 0; i < files.length; i++) {
    const filePath = path.join(stepsDir, files[i]);
    const content = readFileSync(filePath, "utf-8").trim();
    if (!content) continue;
    // Extract a title from the filename: "05-draft.md" → "DRAFT"
    const titleMatch = files[i].match(/^\d+-(.+)\.md$/);
    const title = titleMatch ? titleMatch[1].replace(/-/g, " ").toUpperCase() : `STEP ${i}`;
    parts.push(`STEP ${i}: ${title}\n${content}`);
  }

  const instruction = parts.join("\n\n");
  console.log(`[cron-task] Loaded ${files.length} steps from ${stepsDir}/`);
  return instruction;
}

/**
 * Resolve initial workflow state from cron-jobs/<job-name>/state.ts.
 * The module should export `defaults` with initial values.
 * Uses tsx to import .ts files at runtime.
 * Returns empty object if no state file exists.
 */
export async function resolveInitialState(job: CronJob): Promise<Record<string, unknown>> {
  const stateFile = path.join(CRON_JOBS_DIR, job.name, "state.ts");
  if (!existsSync(stateFile)) return {};
  try {
    const mod = await tsImport(stateFile, import.meta.url);
    const defaults = mod.defaults ?? {};
    if (Object.keys(defaults).length > 0) {
      console.log(`[cron-task] Loaded initial state for "${job.name}": ${Object.keys(defaults).join(", ")}`);
    }
    return defaults;
  } catch (err) {
    console.error(`[cron-task] Failed to load state from ${stateFile}:`, err);
    return {};
  }
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

  // Seed initial state from src/workflows/<name>.ts if present
  const initialState = await resolveInitialState(job);
  if (Object.keys(initialState).length > 0) {
    metadata.initialState = initialState;
  }

  return insertTask({
    instruction: resolveInstruction(job),
    metadata,
  });
}
