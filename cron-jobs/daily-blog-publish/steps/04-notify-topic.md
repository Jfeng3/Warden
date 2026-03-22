Send a Telegram notification about the selected topic using send.sh. Follow the Topic Notification Template in skills/select-topic. Include keyword research data from workflow state: primary_keyword, keyword_volume, keyword_difficulty, and keyword_opportunity. Add a "KEYWORD" section to the notification showing these values. Execute exactly:
cat > /tmp/tg-msg.html <<'MSG'
[your formatted message here using the template, with keyword data section added]
MSG
bash skills/notification/send.sh 7823756809 < /tmp/tg-msg.html