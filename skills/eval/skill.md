---
trigger: When evaluating blog post quality before or after publishing
description: Evaluation criteria for openclaws.blog posts — used to score and rank content
---
# Blog Post Evaluation

Score each post against these criteria. Higher priority items are listed first.

## Hard Rules (pass/fail)
1. **No internal tooling references** — DO NOT mention Warden, pm2, cron jobs, or any internal infrastructure
2. **No unexplained developer jargon** — audience is non-technical business professionals

## Title Quality
3. **Specific and concrete** — contains numbers, stats, costs, timeframes, or bold claims (not vague "The State of X" or "Why You Need X")
4. **Eye-catching** — hooks curiosity, makes the reader stop scrolling
5. **Not templated** — avoids overused formats like "Why Your Business Needs X", "The Ultimate Guide to X", "N Steps to Y"

## Content Substance
6. **Answers a real question** — maps to something people actually search or ask an AI ("how much does X cost?", "X vs Y", "what is X?")
7. **Leads with hard data** — concrete numbers, costs, or stats early in the post, not buried at the bottom
8. **Original angle** — offers a take, framework, or data point not available elsewhere
9. **Editorial voice** — reads like a take or analysis, not a product brochure or press release

## Strategic Value
10. **High-intent query targeting** — targets queries from people ready to act (evaluate, buy, deploy), not just browse
11. **Content cluster gravity** — serves as an anchor that other posts link to, or strengthens an existing cluster
12. **AEO extractability** — contains quotable statements, comparison tables, or structured answers that AI models can cite

## Publish Gate (for cron blog jobs)

After generating a final draft, score it 1-100 using the criteria above. This score determines what happens next:

- **Score >= 70**: Publish to WordPress via wp-cli as normal
- **Score < 70**: DO NOT publish. Instead, send a Telegram notification with:
  - The score
  - Which criteria failed or scored low
  - The draft title
  - A one-line summary of what would need to improve

This prevents low-quality posts from going live automatically. The draft can be reworked and published manually later.