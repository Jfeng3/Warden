You are writing a daily blog post for openclaws.blog. Follow these steps in order.

## MUST DO

- If a step fails or produces an error, send an error notification to Telegram immediately before stopping:
  cat > /tmp/tg-msg.html <<'MSG'
  [WORKFLOW ERROR]
  Step: [current step name]
  Error: [what went wrong]
  MSG
  bash skills/notification/send.sh 7823756809 < /tmp/tg-msg.html

- **Save a workflow log** at the end of every run (success or failure). Write the log to `cron-jobs/daily-blog-publish/logs/YYYY-MM-DD-HHmm.log` using the current date and time. The log must include: which steps ran, their outputs, any errors, the final workflow state keys and values, and whether the post was published or held back.