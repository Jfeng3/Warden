---
trigger: When sending notifications, task results, or messages to the user via Telegram or other channels
description: Rules for how Warden should format and deliver notifications
---
# Notification Rules

## Telegram

Telegram is the primary notification channel. All cron job results and task notifications go to Telegram.

### Formatting Rules

Telegram messages use HTML parse mode. Do NOT use markdown syntax (**, *, ```, etc.).

- Use `<b>bold</b>` to highlight important keywords, names, numbers, and new findings
- Use `<i>italic</i>` sparingly for emphasis or context
- Do NOT overuse bold — only highlight what truly matters (e.g. new pages, key numbers, action items)
- Use line breaks for separation between sections
- Use bullet points (•) or dashes (-) for lists
- Use ALL CAPS for section headers (e.g. WHAT HAPPENED TODAY)
- Keep messages concise and scannable — no walls of text
- No emojis unless they add clarity (e.g. checkmarks for action items)
- Escape HTML special characters in content: `&` → `&amp;`, `<` → `&lt;`, `>` → `&gt;`

### Routing

For a task result to reach Telegram, the task must have metadata:
```json
{"source": "telegram", "chatId": 7823756809}
```

Cron jobs need this in their `task_metadata` field. Without it, results log to stdout but never reach Telegram.

### Message Length

- Telegram has a 4096 character limit per message
- If a summary exceeds this, truncate and end with "Full report saved to daily-scans/MM-DD-scan.md"
- Prioritize actionable info over comprehensive coverage

## General Notification Principles

- Lead with the most important info — don't bury the headline
- Use simple English a business person would understand
- Action items should be clearly separated and scannable
- If nothing notable happened, say so briefly — don't pad the message
