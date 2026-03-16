# Workflow Context Window

Each step in a multi-step workflow gets a fresh agent session (clean context window). The runner injects four sections before the step instruction:

## What each step sees

```
┌─────────────────────────────────────────────────────────┐
│ 1. PREAMBLE (from workflow.md)                          │
│    Global context — who you are, what the workflow does  │
│                                                         │
│ 2. WORKFLOW PROGRESS                                    │
│    Step list with [done] / [current] / [ ] markers      │
│                                                         │
│ 3. WORKFLOW STATE (from prior steps)                    │
│    Lightweight key-value pairs set via set_state tool    │
│                                                         │
│ 4. STEP INSTRUCTION (from steps/NN-name.md)             │
│    The actual task for this step                         │
└─────────────────────────────────────────────────────────┘
```

## Example: Step 6 of 13 (SEO Audit)

```
You are writing a daily blog post for openclaws.blog. Follow these steps in order.

## Workflow Progress (step 7 of 13)

  [done] Step 0: LOAD UTILITIES
  [done] Step 1: RESEARCH
  [done] Step 2: PICK TOPIC
  [done] Step 3: NOTIFY TOPIC
  [done] Step 4: EVAL TOPIC
  [done] Step 5: DRAFT
  [current] Step 6: SEO AUDIT
  [ ] Step 7: AEO AUDIT
  [ ] Step 8: STYLE AUDIT
  [ ] Step 9: REVIEW FIX
  [ ] Step 10: EVAL FINAL
  [ ] Step 11: PUBLISH
  [ ] Step 12: NOTIFY

## Workflow State (from previous steps)

- draft_dir: "/Users/jie/Codes/warden/draft-html"
- publish_dir: "/Users/jie/Codes/warden/publish-html"
- topic_slug: "ai-agent-security"
- topic_pillar: "agent-setup-devops"
- draft_path: "/Users/jie/Codes/warden/draft-html/ai-agent-security-draft.html"

Use the get_state tool to read specific values. Use set_state to persist data for subsequent steps.

STEP 6: SEO AUDIT
Load skills/seo-audit. Run through the full on-page SEO checklist against the draft file
(get draft_path from workflow state). Produce a numbered list of all issues found.
Use set_state to save the list as seo_issues.
```

## Why fresh sessions per step

| Approach | Context by step 12 | Risk |
|----------|-------------------|------|
| Single session (old) | 500k+ tokens (all prior conversations, tool calls, skill loads, draft HTML) | Context overflow, step skipping |
| Fresh session + state (current) | ~500 tokens (preamble + progress + state) + step instruction | Clean, predictable |

Heavy artifacts (draft HTML, audit checklists, skill content) stay on disk. The state only holds references and small structured data. The agent reads files from disk when it needs actual content.

## State flow across steps

```
Step 0:  defaults → { draft_dir, publish_dir }
Step 2:  agent calls set_state("topic_slug", "ai-agent-security")
         agent calls set_state("topic_pillar", "agent-setup-devops")
Step 5:  agent calls set_state("draft_path", ".../draft-html/ai-agent-security-draft.html")
Step 6:  agent calls set_state("seo_issues", [...])
Step 7:  agent calls set_state("aeo_issues", [...])
Step 8:  agent calls set_state("style_issues", [...])
Step 9:  agent calls set_state("publish_path", ".../publish-html/ai-agent-security.html")
Step 10: agent calls set_state("eval_score", 82)
Step 11: agent calls set_state("wp_post_id", 145)
```

## Files involved

| File | Role |
|------|------|
| `src/runner.ts` | Parses steps, manages fresh sessions, injects context |
| `src/workflow-state.ts` | WorkflowState class + set_state/get_state tools |
| `src/session-store.ts` | `buildFreshSession()` creates per-step sessions |
| `src/cron-task.ts` | Reads folder structure, composes instruction, loads state.ts |
| `cron-jobs/<name>/workflow.md` | Preamble text |
| `cron-jobs/<name>/state.ts` | Typed state interface + defaults |
| `cron-jobs/<name>/steps/*.md` | Individual step instructions |
