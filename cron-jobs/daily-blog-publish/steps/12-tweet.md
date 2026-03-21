Only run this step if eval_score >= 70 and wp_post_id is set (get both from workflow state). Load skills/twitter.

Compose a tweet (max 280 chars) with:
- The post title or a punchy one-line takeaway
- The blog post URL: https://openclaws.blog/?p={wp_post_id}

Post it:
```bash
bash skills/twitter/tweet.sh "Your tweet text here"
```

Parse the JSON response to extract the tweet ID (field: `data.id`). Use set_state to save it as `tweet_id`.

If the tweet fails, log the error but do NOT stop the workflow — proceed to the next step (notify). Use set_state to save tweet_id as null.
