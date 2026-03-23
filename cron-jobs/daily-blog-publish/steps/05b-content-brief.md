Load skills/youdotcom-cli and skills/publish. Get topic_slug, topic_pillar, primary_keyword, secondary_keywords, and long_tail_keywords from workflow state.

Build a structured content brief for the draft step. The brief locks in the outline, sources, and internal links BEFORE writing begins.

1. **SERP deep-dive**: Search You.com for the primary_keyword. Read the top 5 ranking articles. For each, note: title, URL, key stats or data points cited, and what angle they take.

2. **Find citable sources**: From those articles, extract 3-5 specific stats, studies, or data points worth citing. Trace each back to its original source where possible (e.g., a Gartner report, a government study, an industry survey — not just another blog quoting the same stat). Record each as: claim, number/data, original source URL.

3. **Identify content gaps**: What are the top articles missing? What questions do they leave unanswered? What angle can we take that they don't? This becomes our differentiation.

4. **Internal links**: Use the wp tool to list recent published posts: `wp(command="post list --post_status=publish --fields=ID,post_title,post_name --number=20")`. Pick 2-3 posts that are topically related to the current topic. Record their title and URL (https://openclaws.blog/{post_name}/).

5. **Compose the brief** as a structured text block:

```
CONTENT BRIEF
=============
Title: [Proposed H1 — compelling, benefit-driven, under 60 chars, includes primary_keyword]
Slug: {topic_slug}
Pillar: {topic_pillar}
Primary keyword: {primary_keyword}
Branded metaphor: [Pick or coin one — e.g., "The Always-On Tax", "The Visibility Gap"]

OUTLINE
-------
H2: Key Takeaways
  - [bullet 1]
  - [bullet 2]
  - [bullet 3]

H2: [Context / Why This Matters section title]
  Key points: [what to cover]
  Cite: [specific stat + source]

H2: [Problem section title]
  H3: [Pain point 1]
  H3: [Pain point 2]
  Key points: [what to cover]

H2: [Solution section title]
  H3: [Benefit 1]
  H3: [Benefit 2]
  Key points: [what to cover]

H2: [Comparison section — must include a table]
  Compare: [X vs Y vs Z]

H2: Real-World Example
  Persona: [Name, role — must be a solo operator]
  Before/after: [what changes for them]

H2: Getting Started
  Steps: [3-5 numbered steps]

H2: FAQ
  Q1: [question]
  Q2: [question]
  Q3: [question]

SOURCES TO CITE
---------------
1. [Claim/stat] — [original source URL]
2. [Claim/stat] — [original source URL]
3. [Claim/stat] — [original source URL]

INTERNAL LINKS
--------------
1. [Post title] — https://openclaws.blog/{slug}/
2. [Post title] — https://openclaws.blog/{slug}/
3. [Post title] — https://openclaws.blog/{slug}/

DIFFERENTIATION
---------------
[1-2 sentences: what our post will cover that the top-ranking articles miss]
```

Save the brief to `cron-jobs/daily-blog-publish/briefs/{topic_slug}.md` (get topic_slug from workflow state). Use set_state to save the full file path as `content_brief_path`.