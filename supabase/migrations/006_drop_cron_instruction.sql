-- Drop instruction column from warden_cron_jobs
-- Instructions are now stored in local files at cron-jobs/<job-name>.md

alter table warden_cron_jobs drop column instruction;
