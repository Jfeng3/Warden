-- Warden: Initial Schema
-- Tables: warden_tasks, warden_agent_steps, warden_conversation_history

-- ============================================================
-- warden_tasks: Central task queue
-- ============================================================
create table if not exists warden_tasks (
  id uuid primary key default gen_random_uuid(),
  instruction text not null,
  status text not null default 'pending'
    check (status in ('pending', 'running', 'done', 'failed')),
  result text,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz
);

create index idx_warden_tasks_status on warden_tasks (status, created_at asc);

-- ============================================================
-- warden_agent_steps: Append-only event log per task
-- ============================================================
create table if not exists warden_agent_steps (
  id bigint generated always as identity primary key,
  task_id uuid not null references warden_tasks(id) on delete cascade,
  step_type text not null,
  tool_name text,
  tool_args jsonb,
  tool_result text,
  is_error boolean not null default false,
  tokens_in int,
  tokens_out int,
  cost_usd numeric(10, 6),
  created_at timestamptz not null default now()
);

create index idx_warden_agent_steps_task_id on warden_agent_steps (task_id, created_at asc);

-- ============================================================
-- warden_conversation_history: Full message log for crash recovery
-- ============================================================
create table if not exists warden_conversation_history (
  id bigint generated always as identity primary key,
  task_id uuid not null unique references warden_tasks(id) on delete cascade,
  messages jsonb not null default '[]',
  updated_at timestamptz not null default now()
);

-- ============================================================
-- updated_at trigger
-- ============================================================
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_warden_tasks_updated_at
  before update on warden_tasks
  for each row execute function update_updated_at();

create trigger trg_warden_conversation_history_updated_at
  before update on warden_conversation_history
  for each row execute function update_updated_at();
