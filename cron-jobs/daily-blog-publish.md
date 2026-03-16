You are writing a daily blog post for openclaws.blog. Follow these steps in order:

STEP 0: LOAD UTILITIES
Load skills/images for diagram rules. NEVER attempt SVG-to-PNG conversion — use inline SVG in HTML or skip images entirely. Never let a missing image block the workflow.

STEP 1: RESEARCH
Load the skill at skills/youdotcom-cli (You.com web search). Load skills/select-topic for the 4 topic pillars. For EACH pillar, search for concrete news from today or yesterday using You.com search with freshness=day. Collect 2-3 findings per pillar.

STEP 2: PICK THE BEST TOPIC
From all findings, pick the single most compelling topic. Choose based on: relevance to our audience (solo operators and one-person companies), timeliness, co-marketing fit with V2Cloud, and content gap opportunity. Use You.com Research endpoint for deeper research on the chosen topic.

STEP 3: NOTIFY TOPIC SELECTION
Send a Telegram notification about the selected topic using send.sh. Follow the Topic Notification Template in skills/select-topic. Execute exactly:
cat > /tmp/tg-msg.html <<'MSG'
[your formatted message here using the template]
MSG
bash skills/notification/send.sh 7823756809 < /tmp/tg-msg.html

STEP 4: EVAL TOPIC
Load skills/eval. Review your chosen topic against the eval rules. If it violates any hard rule, go back to STEP 2 and pick a different topic.

STEP 5: DRAFT
Load skills/draft. Write a full blog post (1,200-1,500 words) following the structure template, audience rules, writing style, and formatting rules. Save the draft as HTML to /tmp/draft.html. All subsequent steps read from and edit this file. Also immediately save a copy to draft-html/<slug>-draft.html (e.g. draft-html/earned-media-distribution-draft.html) — this is the archival copy. If you include diagrams, use inline SVG — never try to generate PNG files.

STEP 6: SEO AUDIT
Load skills/seo-audit. Run through the full on-page SEO checklist against /tmp/draft.html. Produce a numbered list of all issues found. Save this list.

STEP 7: AEO AUDIT
Load skills/aeo-audit. Run through the pre-publish AEO checklist against /tmp/draft.html. Produce a numbered list of all issues found. Save this list.

STEP 8: STYLE AUDIT
Load skills/style-audit. Audit /tmp/draft.html for visual consistency. Check every table against the brand table style (blue header, border dividers, cell padding). Fix any tables that don't match. Produce a list of style issues found.

STEP 9: REVIEW & FIX
Review the combined SEO, AEO, and style issue lists. Apply all fixes and write the final version to publish-html/<slug>.html (e.g. publish-html/earned-media-distribution.html). Do NOT edit /tmp/draft.html further — the publish-ready file lives in publish-html/. Do a final read-through.

STEP 10: EVAL FINAL DRAFT (PUBLISH GATE)
Load skills/eval. Score the final draft at publish-html/<slug>.html from 1 to 100 using all eval criteria. This score determines the next step:
- If score >= 70: proceed to STEP 11 (publish)
- If score < 70: SKIP publishing. Go directly to STEP 12 and send a Telegram notification that includes: the score, which criteria failed or scored low, the draft title, and a one-line summary of what needs improvement. Do NOT publish to WordPress.

STEP 11: PUBLISH
Only reach this step if the eval score is >= 70. Load skills/publish. Publish publish-html/<slug>.html as a draft (respect publish_mode in metadata). Assign the english category.

STEP 12: NOTIFY
Send a Telegram notification using send.sh.

If the post was PUBLISHED (score >= 70):
cat > /tmp/tg-msg.html <<'MSG'
[your formatted message with post title, pillar, draft ID, eval score, and /approve or /reject instructions]
MSG
bash skills/notification/send.sh 7823756809 < /tmp/tg-msg.html

If the post was HELD BACK (score < 70):
cat > /tmp/tg-msg.html <<'MSG'
[HELD BACK — EVAL SCORE TOO LOW]
Title: [draft title]
Score: [X]/100
Failed criteria:
• [criterion]: [why it failed]
• [criterion]: [why it failed]
What to improve: [one-line summary]
MSG
bash skills/notification/send.sh 7823756809 < /tmp/tg-msg.html
