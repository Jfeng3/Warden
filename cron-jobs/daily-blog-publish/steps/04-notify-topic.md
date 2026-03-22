Send a Telegram notification about the selected topic using send.sh. Follow the Topic Notification Template in skills/select-topic. The notification MUST include:

1. CANDIDATES EVALUATED — list all 3 candidate topics from candidate_topics (workflow state), showing each topic's title, pillar, and its best keyword volume/difficulty
2. SELECTED TOPIC — the winning topic with a brief explanation of why it was chosen over the other two (e.g. higher volume, lower difficulty, better keyword opportunity)
3. KEYWORD DATA — primary_keyword, keyword_volume, keyword_difficulty, keyword_opportunity, secondary_keywords, and long_tail_keywords from workflow state

Execute exactly:
cat > /tmp/tg-msg.html <<'MSG'
[your formatted message here using the template, with keyword data section added]
MSG
bash skills/notification/send.sh 7823756809 < /tmp/tg-msg.html