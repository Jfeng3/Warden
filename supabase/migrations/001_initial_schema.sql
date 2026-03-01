-- Warden: Initial Schema
-- Tables: tasks, execution_logs, sessions, config, schedules

-- ============================================================
-- tasks: Central task queue
-- ============================================================
create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  prompt text not null,
  context jsonb default '{}',
  status text not null default 'queued'
    check (status in ('queued', 'running', 'completed', 'failed', 'cancelled')),
  priority int not null default 0,
  retry_count int not null default 0,
  max_retries int not null default 3,
  session_id uuid,
  result text,
  error text,
  idempotency_key text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz
);

create index idx_tasks_status_priority on tasks (status, priority desc, created_at asc);
create index idx_tasks_session_id on tasks (session_id);

-- ============================================================
-- execution_logs: Append-only event log per task
-- ============================================================
create table if not exists execution_logs (
  id bigint generated always as identity primary key,
  task_id uuid not null references tasks(id) on delete cascade,
  session_id uuid,
  event_type text not null,
  tool_name text,
  tool_args jsonb,
  tool_result text,
  text_delta text,
  tokens_in int,
  tokens_out int,
  cost_usd numeric(10, 6),
  created_at timestamptz not null default now()
);

create index idx_execution_logs_task_id on execution_logs (task_id, created_at asc);
create index idx_execution_logs_session_id on execution_logs (session_id);

-- ============================================================
-- sessions: Session metadata
-- ============================================================
create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references tasks(id) on delete set null,
  model text not null,
  provider text not null,
  total_tokens_in int not null default 0,
  total_tokens_out int not null default 0,
  total_cost_usd numeric(10, 6) not null default 0,
  started_at timestamptz not null default now(),
  ended_at timestamptz
);

create index idx_sessions_task_id on sessions (task_id);

-- ============================================================
-- config: Key-value runtime config
-- ============================================================
create table if not exists config (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

-- Seed default config
insert into config (key, value) values
  ('default_model', '"claude-sonnet-4-20250514"'),
  ('default_provider', '"anthropic"'),
  ('max_concurrent_tasks', '1'),
  ('task_poll_interval_ms', '2000'),
  ('max_retries', '3')
on conflict (key) do nothing;

-- ============================================================
-- schedules: Local mirror of QStash cron schedules
-- ============================================================
create table if not exists schedules (
  id uuid primary key default gen_random_uuid(),
  qstash_schedule_id text unique,
  name text not null,
  cron text not null,
  prompt text not null,
  context jsonb default '{}',
  enabled boolean not null default true,
  last_triggered_at timestamptz,
  created_at timestamptz not null default now(),
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

create trigger trg_tasks_updated_at
  before update on tasks
  for each row execute function update_updated_at();

create trigger trg_config_updated_at
  before update on config
  for each row execute function update_updated_at();

create trigger trg_schedules_updated_at
  before update on schedules
  for each row execute function update_updated_at();
