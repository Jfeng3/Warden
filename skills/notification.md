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
- Use `<i>italic</i>` sparingly for secondary context
- Do NOT overuse bold — only highlight what truly matters
- Use `―――――――――――――` (horizontal line with em dashes) to separate major sections
- Use line breaks generously — dense blocks of text are hard to scan on mobile
- Escape HTML special characters: `&` → `&amp;`, `<` → `&lt;`, `>` → `&gt;`

### Visual Hierarchy

Use these elements to create clear visual layers:

1. **Top headline**: One-line emoji + bold summary of the most important finding
2. **Section dividers**: `―――――――――――――` between major sections
3. **Section headers**: Emoji + ALL CAPS (e.g. `📡 WHAT THEY DID`)
4. **List items**: `▸` for regular items, `⚡` for high-priority items
5. **Action items**: `☐` for todos
6. **Numbers and names**: Always bold (`<b>10 posts</b>`, `<b>Jason</b>`)

### Daily Scan Notification Template

Follow this exact structure for daily scan summaries:

```
🔔 <b>[One-line headline of the biggest finding today]</b>

―――――――――――――
📡 WHAT V2CLOUD DID
―――――――――――――

<b>New:</b>
⚡ <b>/slug-name</b> — page title (Mar 4)
▸ <b>/slug-name</b> — page title (Mar 5)

<b>Refreshed blogs:</b>
▸ <b>/blog/slug-name</b> — post title (Mar 4)
▸ <b>/blog/slug-name</b> — post title (Mar 5)
▸ <b>/blog/slug-name</b> — post title (Mar 5)

<b>Refreshed pages:</b>
▸ <b>/solutions/slug-name</b> — page title (Mar 3)
▸ <b>/platform/slug-name</b> — page title (Mar 3)

<i>Bottom line: [One sentence summary of their overall activity pattern]</i>

―――――――――――――
🤝 TALKING POINTS FOR JASON
―――――――――――――

<b>Hook:</b> [Opening line to start the conversation — reference something specific they did this week that shows you're paying attention]

<b>Credibility:</b> [Share a relevant insight, data point, or something we've done that positions us as a valuable partner]

<b>Discovery Q:</b> [A question that uncovers their priorities, timeline, or pain points — not yes/no, open-ended]

<b>CTA:</b> [One specific, low-friction next step to propose for this week — e.g. co-author a piece, share a draft, sync on keywords]

―――――――――――――
☐ ACTION ITEMS
―――――――――――――

☐ <b>Draft</b>: [Topic title]
☐ <b>Draft</b>: [Topic title]
☐ <b>Pitch</b>: [What to pitch at sync]
```

### Routing

For a task result to reach Telegram, the task must have metadata:
```json
{"source": "telegram", "chatId": 7823756809}
```

Cron jobs need this in their `task_metadata` field. Without it, results log to stdout but never reach Telegram.

### Message Length

- Telegram has a 4096 character limit per message
- If a summary exceeds this, truncate and end with "Full report in daily-scans/MM-DD-scan.md"
- Prioritize actionable info over comprehensive coverage
- On mobile, shorter is always better — cut ruthlessly

## General Notification Principles

- Lead with the headline — the single most important finding goes at the very top
- One glance should tell the user whether they need to read further
- Use simple English a business person would understand
- White space is your friend — never cram information together
- If nothing notable happened, say so in one line — don't pad
