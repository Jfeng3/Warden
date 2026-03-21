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
- Include the blog post URL: `https://openclaws.blog/?p={wp_post_id}`
- Keep it concise: title or key takeaway + link
- No hashtag spam — use 1-2 relevant hashtags max, or none
- Write in the blog's voice: practical, direct, for solo operators
- Do NOT include emojis unless they add clarity

## Environment Variables

Requires these in `.env`:
- `TWITTER_CONSUMER_KEY`
- `TWITTER_CONSUMER_SECRET`
- `TWITTER_ACCESS_TOKEN`
- `TWITTER_ACCESS_TOKEN_SECRET`
