export type TaskStatus = "queued" | "running" | "completed" | "failed" | "cancelled";

export interface Task {
  id: string;
  prompt: string;
  context: Record<string, unknown>;
  status: TaskStatus;
  priority: number;
  retry_count: number;
  max_retries: number;
  session_id: string | null;
  result: string | null;
  error: string | null;
  idempotency_key: string | null;
  created_at: string;
  updated_at: string;
  started_at: string | null;
  completed_at: string | null;
}

export interface ExecutionLog {
  id: number;
  task_id: string;
  session_id: string | null;
  event_type: string;
  tool_name: string | null;
  tool_args: Record<string, unknown> | null;
  tool_result: string | null;
  text_delta: string | null;
  tokens_in: number | null;
  tokens_out: number | null;
  cost_usd: number | null;
  created_at: string;
}

export interface Session {
  id: string;
  task_id: string | null;
  model: string;
  provider: string;
  total_tokens_in: number;
  total_tokens_out: number;
  total_cost_usd: number;
  started_at: string;
  ended_at: string | null;
}

export interface Config {
  key: string;
  value: unknown;
  updated_at: string;
}

export interface Schedule {
  id: string;
  qstash_schedule_id: string | null;
  name: string;
  cron: string;
  prompt: string;
  context: Record<string, unknown>;
  enabled: boolean;
  last_triggered_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaskPayload {
  prompt: string;
  context?: Record<string, unknown>;
  priority?: number;
  idempotency_key?: string;
}
