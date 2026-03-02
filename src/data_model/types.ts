export type TaskStatus = "pending" | "running" | "done" | "failed";

export interface Task {
  id: string;
  instruction: string;
  status: TaskStatus;
  result: string | null;
  error: string | null;
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
}
