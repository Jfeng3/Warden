import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { Task, TaskPayload, ExecutionLog, Session, Config } from "./types.js";

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (client) return client;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
  }
  client = createClient(url, key);
  return client;
}

// ── Tasks ──────────────────────────────────────────────────

export async function insertTask(payload: TaskPayload): Promise<Task> {
  const { data, error } = await getSupabase()
    .from("tasks")
    .insert({
      prompt: payload.prompt,
      context: payload.context ?? {},
      priority: payload.priority ?? 0,
      idempotency_key: payload.idempotency_key ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data as Task;
}

export async function claimNextTask(): Promise<Task | null> {
  // Atomically claim the highest-priority queued task
  const { data, error } = await getSupabase().rpc("claim_next_task");
  if (error) throw error;
  return (data as Task) ?? null;
}

export async function pollNextTask(): Promise<Task | null> {
  const { data, error } = await getSupabase()
    .from("tasks")
    .select()
    .eq("status", "queued")
    .order("priority", { ascending: false })
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data as Task | null;
}

export async function claimTask(taskId: string): Promise<boolean> {
  const { data, error } = await getSupabase()
    .from("tasks")
    .update({ status: "running", started_at: new Date().toISOString() })
    .eq("id", taskId)
    .eq("status", "queued")
    .select()
    .maybeSingle();
  if (error) throw error;
  return data !== null;
}

export async function completeTask(taskId: string, result: string): Promise<void> {
  const { error } = await getSupabase()
    .from("tasks")
    .update({
      status: "completed",
      result,
      completed_at: new Date().toISOString(),
    })
    .eq("id", taskId);
  if (error) throw error;
}

export async function failTask(taskId: string, errorMsg: string): Promise<void> {
  const { data: task } = await getSupabase()
    .from("tasks")
    .select("retry_count, max_retries")
    .eq("id", taskId)
    .single();

  if (task && task.retry_count < task.max_retries) {
    // Re-queue for retry
    const { error } = await getSupabase()
      .from("tasks")
      .update({
        status: "queued",
        retry_count: task.retry_count + 1,
        error: errorMsg,
        started_at: null,
      })
      .eq("id", taskId);
    if (error) throw error;
  } else {
    const { error } = await getSupabase()
      .from("tasks")
      .update({
        status: "failed",
        error: errorMsg,
        completed_at: new Date().toISOString(),
      })
      .eq("id", taskId);
    if (error) throw error;
  }
}

export async function resetStuckTasks(): Promise<number> {
  const { data, error } = await getSupabase()
    .from("tasks")
    .update({ status: "queued", started_at: null })
    .eq("status", "running")
    .select();
  if (error) throw error;
  return data?.length ?? 0;
}

// ── Execution Logs ─────────────────────────────────────────

export async function insertLog(log: Omit<ExecutionLog, "id" | "created_at">): Promise<void> {
  const { error } = await getSupabase().from("execution_logs").insert(log);
  if (error) throw error;
}

// ── Sessions ───────────────────────────────────────────────

export async function createSession(
  taskId: string,
  model: string,
  provider: string
): Promise<Session> {
  const { data, error } = await getSupabase()
    .from("sessions")
    .insert({ task_id: taskId, model, provider })
    .select()
    .single();
  if (error) throw error;
  return data as Session;
}

export async function updateSessionStats(
  sessionId: string,
  tokensIn: number,
  tokensOut: number,
  costUsd: number
): Promise<void> {
  const { error } = await getSupabase()
    .from("sessions")
    .update({
      total_tokens_in: tokensIn,
      total_tokens_out: tokensOut,
      total_cost_usd: costUsd,
      ended_at: new Date().toISOString(),
    })
    .eq("id", sessionId);
  if (error) throw error;
}

// ── Config ─────────────────────────────────────────────────

export async function getConfigValue<T>(key: string, fallback: T): Promise<T> {
  const { data, error } = await getSupabase()
    .from("config")
    .select("value")
    .eq("key", key)
    .maybeSingle();
  if (error || !data) return fallback;
  return data.value as T;
}

export async function setConfigValue(key: string, value: unknown): Promise<void> {
  const { error } = await getSupabase()
    .from("config")
    .upsert({ key, value })
    .select();
  if (error) throw error;
}

// ── Schedules ──────────────────────────────────────────────

export async function upsertSchedule(schedule: {
  qstash_schedule_id: string;
  name: string;
  cron: string;
  prompt: string;
  context?: Record<string, unknown>;
}): Promise<void> {
  const { error } = await getSupabase()
    .from("schedules")
    .upsert(
      {
        qstash_schedule_id: schedule.qstash_schedule_id,
        name: schedule.name,
        cron: schedule.cron,
        prompt: schedule.prompt,
        context: schedule.context ?? {},
      },
      { onConflict: "qstash_schedule_id" }
    );
  if (error) throw error;
}
