You are writing a daily blog post for openclaws.blog. Follow these steps in order.

## MUST DO

- If a step fails or produces an error, send an error notification to Telegram immediately before stopping:
  cat > /tmp/tg-msg.html <<'MSG'
  [WORKFLOW ERROR]
  Step: [current step name]
  Error: [what went wrong]
  MSG
  bash skills/notification/send.sh 7823756809 < /tmp/tg-msg.html