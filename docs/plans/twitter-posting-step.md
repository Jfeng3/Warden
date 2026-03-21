# Twitter Posting Step — Design

## Problem
After publishing a blog post, we want to automatically tweet a link to it from @JupiterAna93211.

## Design

### Auth: OAuth 1.0a
- Already configured with Read+Write permissions
- Tokens don't expire — ideal for headless/automated use
- 4 env vars: `TWITTER_CONSUMER_KEY`, `TWITTER_CONSUMER_SECRET`, `TWITTER_ACCESS_TOKEN`, `TWITTER_ACCESS_TOKEN_SECRET`

### New files
| File | Purpose |
|------|---------|
| `skills/twitter/tweet.sh` | Bash wrapper (matches `notification/send.sh` pattern). Takes tweet text as arg or stdin. |
| `skills/twitter/post.ts` | Node.js script that signs OAuth 1.0a requests using built-in `crypto` and posts via X API v2 (`POST https://api.x.com/2/tweets`). No new npm deps. |
| `skills/twitter/SKILL.md` | Skill doc for the agent. |
| `steps/12-tweet.md` | New workflow step between publish and notify. |

### Modified files
| File | Change |
|------|--------|
| `steps/12-notify.md` | Rename to `steps/13-notify.md` |
| `steps/10-eval-final.md` | Update step reference from 12 → 13 |
| `state.ts` | Add `tweet_id: string \| null` |
| `.env.example` | Add 4 Twitter env vars |

### Step 12 logic
1. Only runs if post was published (eval_score >= 70 and wp_post_id exists)
2. Compose tweet: title + URL (openclaws.blog/?p={wp_post_id})
3. Call `bash skills/twitter/tweet.sh "<text>"`
4. Save tweet ID to workflow state as `tweet_id`
5. On failure: log error but don't block the notify step

### Tweet format
Keep it simple — title + link, under 280 chars. The agent can vary the phrasing.
