Load skills/eval. Get publish_path from workflow state.

You have up to 3 attempts to pass eval. For each attempt:

1. Read the file at publish_path
2. Score it from 1 to 100 using all eval criteria
3. If score >= 70: save eval_score via set_state and proceed to the next step (publish)
4. If score < 70: list which criteria failed and why, then read the file, apply fixes to address the failed criteria (text-only edits, no web searches or API calls), and write the corrected version back to publish_path. Then re-score.

After 3 failed attempts (score still < 70 on the third try), save the final eval_score via set_state and SKIP publishing. Go directly to STEP 14 (notify) and send a Telegram notification that includes: the score, which criteria failed or scored low, the draft title, and a one-line summary of what needs improvement. Do NOT publish to WordPress.