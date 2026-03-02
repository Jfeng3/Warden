-- Add metadata column to warden_tasks for integration context (e.g. SMS reply-to phone number)
alter table warden_tasks add column if not exists metadata jsonb;
