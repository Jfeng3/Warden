export type TaskStatus = "pending" | "running" | "done" | "failed";

export interface Task {
  id: string;
  instruction: string;
  status: TaskStatus;
  result: string | null;
  error: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  started_at: string | null;
  completed_at: string | null;
}

export interface AgentStep {
  id: number;
  task_id: string;
  step_type: string;
  tool_name: string | null;
  tool_args: Record<string, unknown> | null;
  tool_result: string | null;
  is_error: boolean;
  tokens_in: number | null;
  tokens_out: number | null;
  cost_usd: number | null;
  created_at: string;
}

export interface ConversationHistory {
  id: number;
  task_id: string;
  messages: unknown[];
  updated_at: string;
}

export interface TaskInput {
  instruction: string;
  metadata?: Record<string, unknown>;
}

// ── Cron Jobs ─────────────────────────────────────────────

export type ScheduleType = "cron" | "at" | "every";
export type PublishMode = "auto" | "draft";

export interface CronJob {
  id: string;
  name: string;
  enabled: boolean;
  schedule_type: ScheduleType;
  cron_expression: string | null;
  cron_timezone: string;
  at_time: string | null;
  every_ms: number | null;
  task_metadata: Record<string, unknown> | null;
  publish_mode: PublishMode;
  last_run_at: string | null;
  next_run_at: string | null;
  last_task_id: string | null;
  run_count: number;
  delete_after_run: boolean;
  created_at: string;
  updated_at: string;
}

export interface CronJobInput {
  name: string;
  schedule_type: ScheduleType;
  cron_expression?: string;
  cron_timezone?: string;
  at_time?: string;
  every_ms?: number;
  task_metadata?: Record<string, unknown>;
  publish_mode?: PublishMode;
  delete_after_run?: boolean;
  next_run_at?: string;
}

export interface CronJobUpdate {
  name?: string;
  enabled?: boolean;
  schedule_type?: ScheduleType;
  cron_expression?: string;
  cron_timezone?: string;
  at_time?: string;
  every_ms?: number;
  task_metadata?: Record<string, unknown>;
  publish_mode?: PublishMode;
  delete_after_run?: boolean;
  next_run_at?: string;
}
