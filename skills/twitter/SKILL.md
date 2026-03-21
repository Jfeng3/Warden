---
trigger: When posting to Twitter/X after publishing a blog post
description: Rules for posting tweets to @JupiterAna93211 via X API v2
---
# Twitter Posting

## Sending a Tweet

Use the tweet.sh script. Write the tweet text to a variable or pass it directly.

```bash
bash skills/twitter/tweet.sh "Your tweet text here (max 280 chars)"
```

Or pipe from stdin:
```bash
echo "Your tweet text" | bash skills/twitter/tweet.sh
```

The script outputs the X API JSON response on success (includes tweet `id`).

## Tweet Formatting Rules

- **Max 280 characters** — the script enforces this
- **Open fast** — the first line is the hook. Lead with a surprising fact, bold claim, or question. Never open with a summary.
- **One idea per post** — each tweet carries exactly one clear takeaway. If you need more, use a thread (one idea per tweet in the thread).
- **Hooks over summaries** — write to stop the scroll, not to recap the article. "Google just gave publishers an AI opt-out. It won't help." beats "New blog post about AI Overviews."
- **Use specifics over slogans** — concrete numbers, tools, or outcomes. "$25/mo Mac Mini beats a $3K/mo agency" not "AI saves money."
- **Keep links out of the main body** — put the URL at the end or in a reply. X deprioritizes posts with inline links.
- **Keep the ask small and clear** — "star the repo" or "read the checklist" not "subscribe, follow, share, and bookmark."
- **Do NOT cross-post** — write native to X. Do not copy the blog headline or intro paragraph verbatim.
- No hashtag spam — 1-2 relevant hashtags max, or none
- Write in the blog's voice: practical, direct, for solo operators
- Do NOT include emojis unless they add clarity
- Include the blog post URL: `https://openclaws.blog/?p={wp_post_id}` (at the end or in a reply)

## Environment Variables

Requires these in `.env`:
- `TWITTER_CONSUMER_KEY`
- `TWITTER_CONSUMER_SECRET`
- `TWITTER_ACCESS_TOKEN`
- `TWITTER_ACCESS_TOKEN_SECRET`
