import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { Task, TaskInput, AgentStep, CronJob, CronJobInput, CronJobUpdate } from "./types.js";

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (client) return client;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_URL and SUPABASE_ANON_KEY must be set");
  }
  client = createClient(url, key);
  return client;
}

// ── Tasks ──────────────────────────────────────────────────

export async function insertTask(input: TaskInput): Promise<Task> {
  const row: Record<string, unknown> = { instruction: input.instruction };
  if (input.metadata) row.metadata = input.metadata;
  const { data, error } = await getSupabase()
    .from("warden_tasks")
    .insert(row)
    .select()
    .single();
  if (error) throw error;
  return data as Task;
}

export async function getTask(taskId: string): Promise<Task | null> {
  const { data, error } = await getSupabase()
    .from("warden_tasks")
    .select()
    .eq("id", taskId)
    .maybeSingle();
  if (error) throw error;
  return data as Task | null;
}

export async function pollNextTask(): Promise<Task | null> {
  const { data, error } = await getSupabase()
    .from("warden_tasks")
    .select()
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data as Task | null;
}

export async function claimTask(taskId: string): Promise<boolean> {
  const { data, error } = await getSupabase()
    .from("warden_tasks")
    .update({ status: "running", started_at: new Date().toISOString() })
    .eq("id", taskId)
    .eq("status", "pending")
    .select()
    .maybeSingle();
  if (error) throw error;
  return data !== null;
}

export async function completeTask(taskId: string, result: string): Promise<void> {
  const { error } = await getSupabase()
    .from("warden_tasks")
    .update({
      status: "done",
      result,
      completed_at: new Date().toISOString(),
    })
    .eq("id", taskId);
  if (error) throw error;
}

export async function failTask(taskId: string, errorMsg: string): Promise<void> {
  const { error } = await getSupabase()
    .from("warden_tasks")
    .update({
      status: "failed",
      error: errorMsg,
      completed_at: new Date().toISOString(),
    })
    .eq("id", taskId);
  if (error) throw error;
}

export async function listActiveTasks(): Promise<Task[]> {
  const { data, error } = await getSupabase()
    .from("warden_tasks")
    .select()
    .in("status", ["pending", "running"])
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Task[];
}

export async function listRecentTasks(limit = 3): Promise<Task[]> {
  const { data, error } = await getSupabase()
    .from("warden_tasks")
    .select()
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as Task[];
}

export async function getRunningTask(): Promise<Task | null> {
  const { data, error } = await getSupabase()
    .from("warden_tasks")
    .select()
    .eq("status", "running")
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data as Task | null;
}

export async function getStepsForTask(taskId: string): Promise<AgentStep[]> {
  const { data, error } = await getSupabase()
    .from("warden_agent_steps")
    .select()
    .eq("task_id", taskId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as AgentStep[];
}

export async function failStuckTasks(): Promise<number> {
  const { data, error } = await getSupabase()
    .from("warden_tasks")
    .update({
      status: "failed",
      error: "Task was stuck in running state on startup",
      completed_at: new Date().toISOString(),
    })
    .eq("status", "running")
    .select();
  if (error) throw error;
  return data?.length ?? 0;
}

// ── Agent Steps ────────────────────────────────────────────

export async function insertAgentStep(
  step: Omit<AgentStep, "id" | "created_at">
): Promise<void> {
  const { error } = await getSupabase().from("warden_agent_steps").insert(step);
  if (error) throw error;
}

// ── Conversation History ───────────────────────────────────

export async function upsertConversationHistory(
  taskId: string,
  messages: unknown[]
): Promise<void> {
  const { error } = await getSupabase()
    .from("warden_conversation_history")
    .upsert(
      { task_id: taskId, messages },
      { onConflict: "task_id" }
    );
  if (error) throw error;
}

export async function getConversationHistory(
  taskId: string
): Promise<unknown[] | null> {
  const { data, error } = await getSupabase()
    .from("warden_conversation_history")
    .select("messages")
    .eq("task_id", taskId)
    .maybeSingle();
  if (error) throw error;
  return (data?.messages as unknown[]) ?? null;
}

// ── Cron Jobs ─────────────────────────────────────────────

export async function insertCronJob(input: CronJobInput): Promise<CronJob> {
  const { data, error } = await getSupabase()
    .from("warden_cron_jobs")
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data as CronJob;
}

export async function getCronJob(id: string): Promise<CronJob | null> {
  const { data, error } = await getSupabase()
    .from("warden_cron_jobs")
    .select()
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as CronJob | null;
}

export async function listCronJobs(enabledOnly = false): Promise<CronJob[]> {
  let query = getSupabase().from("warden_cron_jobs").select().order("created_at", { ascending: true });
  if (enabledOnly) query = query.eq("enabled", true);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as CronJob[];
}

export async function updateCronJob(id: string, updates: CronJobUpdate): Promise<CronJob> {
  const { data, error } = await getSupabase()
    .from("warden_cron_jobs")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as CronJob;
}

export async function deleteCronJob(id: string): Promise<void> {
  const { error } = await getSupabase()
    .from("warden_cron_jobs")
    .delete()
    .eq("id", id);
  if (error) throw error;
}

export async function pollDueCronJobs(): Promise<CronJob[]> {
  const { data, error } = await getSupabase()
    .from("warden_cron_jobs")
    .select()
    .eq("enabled", true)
    .lte("next_run_at", new Date().toISOString())
    .order("next_run_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as CronJob[];
}

export async function markCronJobRun(id: string, taskId: string, nextRunAt: string | null): Promise<void> {
  const updates: Record<string, unknown> = {
    last_run_at: new Date().toISOString(),
    last_task_id: taskId,
    run_count: undefined, // handled by raw increment below
    next_run_at: nextRunAt,
  };
  // Supabase JS doesn't support raw SQL increment, so we do two operations
  const { error } = await getSupabase()
    .from("warden_cron_jobs")
    .update({
      last_run_at: new Date().toISOString(),
      last_task_id: taskId,
      next_run_at: nextRunAt,
    })
    .eq("id", id);
  if (error) throw error;

  // Increment run_count via RPC or a second update reading current value
  const job = await getCronJob(id);
  if (job) {
    await getSupabase()
      .from("warden_cron_jobs")
      .update({ run_count: job.run_count + 1 })
      .eq("id", id);
  }
}
