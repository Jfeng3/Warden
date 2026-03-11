-- Add publish_mode to cron jobs for draft-review-publish workflow
-- Values: 'auto' (publish immediately, current behavior) or 'draft' (create as draft, notify for review)
ALTER TABLE warden_cron_jobs ADD COLUMN publish_mode text NOT NULL DEFAULT 'auto';
