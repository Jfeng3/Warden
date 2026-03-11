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

export async function toggleEnabled(jobId: string, currentEnabled: boolean) {
  const sb = createServerSupabase();
  const { error } = await sb
    .from("warden_cron_jobs")
    .update({ enabled: !currentEnabled })
    .eq("id", jobId);
  if (error) throw error;
  revalidatePath("/dashboard/cron");
}
