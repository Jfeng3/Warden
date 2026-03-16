Send a Telegram notification about the selected topic using send.sh. Follow the Topic Notification Template in skills/select-topic. Execute exactly:
cat > /tmp/tg-msg.html <<'MSG'
[your formatted message here using the template]
MSG
bash skills/notification/send.sh 7823756809 < /tmp/tg-msg.html