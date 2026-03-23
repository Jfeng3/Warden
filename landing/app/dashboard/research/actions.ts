"use server";

import { writeFile } from "fs/promises";

const STEP_PATH = "/Users/jie/Codes/warden/cron-jobs/daily-blog-publish/steps/01-research.md";

export async function saveResearch(content: string): Promise<{ ok: boolean; error?: string }> {
  try {
    await writeFile(STEP_PATH, content, "utf-8");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}
