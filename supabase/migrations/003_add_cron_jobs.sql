-- Warden: Cron/Scheduling support
-- Table: warden_cron_jobs

create table if not exists warden_cron_jobs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  enabled boolean not null default true,

  -- Schedule type: 'cron' (recurring), 'at' (one-shot), 'every' (interval)
  schedule_type text not null check (schedule_type in ('cron', 'at', 'every')),
  cron_expression text,        -- e.g. '0 9 * * *' (for schedule_type = 'cron')
  cron_timezone text not null default 'UTC',  -- IANA timezone
  at_time timestamptz,         -- one-shot fire time (for schedule_type = 'at')
  every_ms bigint,             -- interval in milliseconds (for schedule_type = 'every')

  instruction text not null,   -- task instruction to run
  task_metadata jsonb,         -- flows to created task (e.g. {source: "telegram", chatId: 123})

  last_run_at timestamptz,
  next_run_at timestamptz,
  last_task_id uuid references warden_tasks(id) on delete set null,
  run_count int not null default 0,

  delete_after_run boolean not null default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index for efficient polling of due jobs
create index idx_warden_cron_jobs_next_run
  on warden_cron_jobs (next_run_at)
  where enabled = true;

-- Reuse existing update_updated_at() trigger from migration 001
create trigger trg_warden_cron_jobs_updated_at
  before update on warden_cron_jobs
  for each row execute function update_updated_at();
