# Eval Publish Gate

## Problem

The daily blog cron job publishes posts automatically without quality control. Some posts go live with weak titles, generic framing, or brochure-like voice — lowering the overall quality bar of openclaws.blog. We manually archived 4 posts that scored below 70/100 on our eval criteria.

## Solution

Add a publish gate to the blog cron job. Before publishing, the agent scores the final draft 1-100 using the `eval` skill criteria. Posts scoring >= 70 publish normally. Posts scoring < 70 are held back, and a Telegram notification is sent instead.

## Design

### Eval Criteria (skills/eval/skill.md)

The score is based on 12 criteria across 4 tiers:

1. **Hard Rules (pass/fail)**: No internal tooling references, no unexplained jargon
2. **Title Quality**: Specific, eye-catching, not templated
3. **Content Substance**: Answers real questions, leads with data, original angle, editorial voice
4. **Strategic Value**: High-intent queries, content cluster gravity, AEO extractability

### Publish Gate Flow

```
Blog cron job generates final draft
  → Load eval skill
  → Score draft 1-100 against criteria
  → If score >= 70:
      → Publish to WordPress via wp-cli
      → Send Telegram notification (published, score, title)
  → If score < 70:
      → DO NOT publish
      → Send Telegram notification with:
        - Score
        - Which criteria failed or scored low
        - Draft title
        - One-line summary of what needs improvement
      → Draft remains available for manual rework
```

### Score Bands

| Range | Meaning |
|-------|---------|
| 85-100 | Exceptional — publish confidently |
| 70-84 | Strong — publish, minor gaps acceptable |
| 55-69 | Average — hold for rework |
| 40-54 | Weak — needs significant revision |
| Below 40 | Needs full rewrite |

## Changes Required

| File | Change |
|------|--------|
| `skills/eval/skill.md` | **Done** — added publish gate section with score threshold and Telegram fallback |
| Blog cron job instruction | Update to load `eval` skill after drafting, score the post, and branch on the result |

## Implementation

The eval skill is already updated. The remaining change is to update the daily blog cron job instruction to include the eval step. This is a prompt-level change — no code modifications needed. The cron job instruction should append:

```
After completing the final draft, load the eval skill and score the post 1-100.
If score >= 70, publish to WordPress. If score < 70, do not publish — send a
Telegram notification with the score, failing criteria, title, and improvement summary.
```

## Risks

- **False negatives**: A good post might score below 70 due to subjective criteria. Mitigation: the post is held as draft, not deleted — easy to publish manually.
- **Score gaming**: The agent could inflate its own score. Mitigation: criteria are specific enough to constrain this, and Telegram notification includes the breakdown for human review.
