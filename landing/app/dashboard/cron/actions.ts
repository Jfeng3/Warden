"use server";

import { createServerSupabase } from "../../lib/supabase";
import { revalidatePath } from "next/cache";

export async function togglePublishMode(jobId: string, currentMode: string) {
  const newMode = currentMode === "draft" ? "auto" : "draft";
  const sb = createServerSupabase();
  const { error } = await sb
    .from("warden_cron_jobs")
    .update({ publish_mode: newMode })
    .eq("id", jobId);
  if (error) throw error;
  revalidatePath("/dashboard/cron");
}

export async function triggerNow(jobId: string) {
  const sb = createServerSupabase();
  const { data: job, error: jobErr } = await sb
    .from("warden_cron_jobs")
    .select("instruction, task_metadata, publish_mode")
    .eq("id", jobId)
    .single();
  if (jobErr || !job) throw jobErr ?? new Error("Job not found");

  const metadata: Record<string, unknown> = {
    ...(job.task_metadata ?? {}),
    cron: true,
  };
  if (job.publish_mode === "draft") {
    metadata.publish_mode = "draft";
  }

  const { error } = await sb
    .from("warden_tasks")
    .insert({ instruction: job.instruction, metadata });
  if (error) throw error;
  revalidatePath("/dashboard/cron");
}

export async function toggleEnabled(jobId: string, currentEnabled: boolean) {
  const sb = createServerSupabase();
  const { error } = await sb
    .from("warden_cron_jobs")
    .update({ enabled: !currentEnabled })
    .eq("id", jobId);
  if (error) throw error;
  revalidatePath("/dashboard/cron");
}
