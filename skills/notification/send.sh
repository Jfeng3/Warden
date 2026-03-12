#!/usr/bin/env bash
# Send a Telegram message using the bot API.
# Usage: bash skills/notification/send.sh <chat_id> <message>
#    or: echo "message" | bash skills/notification/send.sh <chat_id>
#    or: bash skills/notification/send.sh <chat_id> < /tmp/msg.html
# Message must be HTML-formatted (Telegram parse_mode=HTML).
# Reads TELEGRAM_BOT_TOKEN from environment.

set -euo pipefail

CHAT_ID="${1:?Usage: send.sh <chat_id> [message]}"

if [ -z "${TELEGRAM_BOT_TOKEN:-}" ]; then
  echo "Error: TELEGRAM_BOT_TOKEN is not set" >&2
  exit 1
fi

# Read message from argument or stdin
if [ -n "${2:-}" ]; then
  MESSAGE="$2"
else
  MESSAGE="$(cat)"
fi

curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
  -H "Content-Type: application/json" \
  -d "$(jq -n --arg chat_id "$CHAT_ID" --arg text "$MESSAGE" '{
    chat_id: $chat_id,
    text: $text,
    parse_mode: "HTML",
    disable_web_page_preview: true
  }')"
