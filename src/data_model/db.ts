import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { Task, TaskInput, AgentStep } from "./types.js";

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
