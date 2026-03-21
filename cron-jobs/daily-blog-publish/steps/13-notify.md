Send a Telegram notification using send.sh.

If the post was PUBLISHED (score >= 70):
cat > /tmp/tg-msg.html <<'MSG'
[your formatted message with post title, pillar, draft ID, eval score, tweet link (if tweet_id is set: https://x.com/JupiterAna93211/status/{tweet_id}), and /approve or /reject instructions]
MSG
bash skills/notification/send.sh 7823756809 < /tmp/tg-msg.html

If the post was HELD BACK (score < 70):
cat > /tmp/tg-msg.html <<'MSG'
[HELD BACK — EVAL SCORE TOO LOW]
Title: [draft title]
Score: [X]/100
Failed criteria:
• [criterion]: [why it failed]
• [criterion]: [why it failed]
What to improve: [one-line summary]
MSG
bash skills/notification/send.sh 7823756809 < /tmp/tg-msg.html