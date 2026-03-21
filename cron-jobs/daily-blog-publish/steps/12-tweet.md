Only run this step if eval_score >= 70 and wp_post_id is set (get both from workflow state). Load skills/twitter.

Read the published blog post from publish_path (get from workflow state). Extract the most surprising stat, claim, or insight from the post — not the title or intro. Compose a tweet (max 280 chars) that:
- Opens with a hook derived from the blog's research (a specific number, counterintuitive finding, or bold claim)
- Does NOT repeat the blog headline verbatim — write native to X
- Puts the blog URL at the end: https://openclaws.blog/?p={wp_post_id}

Post it:
```bash
bash skills/twitter/tweet.sh "Your tweet text here"
```

Parse the JSON response to extract the tweet ID (field: `data.id`). Use set_state to save it as `tweet_id`.

If the tweet fails, log the error but do NOT stop the workflow — proceed to the next step (notify). Use set_state to save tweet_id as null.
