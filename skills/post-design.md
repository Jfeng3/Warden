---
trigger: When designing or formatting blog posts, notifications, or any published content for openclaws.blog or Telegram
description: Visual design and formatting standards for all published content
---
# Post Design Guide

Design rules for blog posts (WordPress HTML), Telegram notifications, and social posts. Every piece of published content should feel intentionally designed — not like AI slop.

## Blog Post HTML Design (WordPress)

WordPress renders HTML, not markdown. All post content must be production-grade HTML with strong visual hierarchy.

### Typography Hierarchy

```html
<h2>Major Section</h2>           <!-- Bold, large — the primary content divider -->
<h3>Subsection</h3>              <!-- Medium weight — breaks up long sections -->
<p><strong>Key term</strong> — inline emphasis for concepts, names, numbers</p>
<p><em>Secondary context</em> — sparingly, for attributions or asides</p>
```

Rules:
- **H1** is the post title (WordPress handles this). Never use H1 in post body.
- **H2** for every major section (Key Takeaways, The Problem, The Solution, FAQ, etc.)
- **H3** for subsections within H2 blocks
- Never skip heading levels (no H2 → H4)
- Bold key terms on **first mention only** — don't bold the same term twice
- No more than 2-3 bold phrases per paragraph

### Comparison Tables

Every post should have at least one table. Tables are high-value for both readers and AI agents.

```html
<table>
<thead>
<tr>
<th>Factor</th>
<th>Option A</th>
<th>Option B</th>
<th>Option C</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Row label</strong></td>
<td>Specific detail, not vague</td>
<td>Specific detail</td>
<td>Specific detail</td>
</tr>
</tbody>
</table>
```

Table design rules:
- Minimum 3 columns, 5 rows
- Bold the row labels (first column)
- Use concrete specifics, not marketing fluff ("$200/mo" not "affordable")
- Header row should be clear category labels
- Keep cell content to 1-2 lines max

### Lists

```html
<!-- Unordered for features, benefits, takeaways -->
<ul>
<li><strong>Key point</strong> — explanation follows the dash</li>
<li><strong>Another point</strong> — keep parallel structure</li>
</ul>

<!-- Ordered for steps, sequences, rankings -->
<ol>
<li><strong>Step name</strong> — what to do and why</li>
<li><strong>Next step</strong> — builds on previous</li>
</ol>
```

List design rules:
- Bold the lead phrase of each item
- Use em dash (—) to separate the lead from explanation
- Keep items parallel in structure (all start with verb, or all start with noun)
- 3-7 items per list — more than 7 loses the reader

### Callout Patterns

For highlighting key insights or warnings within a post:

```html
<!-- Branded concept introduction -->
<p>That's <strong>The Documentation Gap</strong> — the growing divide between
businesses whose product documentation is ready for AI agents and those whose
products are effectively invisible.</p>

<!-- Before/After pattern -->
<p><strong>Before closing The Documentation Gap:</strong></p>
<ul>
<li>Invisible to AI-powered discovery</li>
<li>Declining inbound leads</li>
</ul>

<p><strong>After closing The Documentation Gap:</strong></p>
<ul>
<li>Product recommended by AI agents</li>
<li>Steady growth in inbound leads</li>
</ul>
```

### Internal Linking

```html
<!-- Contextual link within a paragraph -->
<p>The shift mirrors what we're seeing in
<a href="https://openclaws.blog/aeo-social-listening-ai-era/">Answer Engine Optimization</a>,
where AI-generated overviews are replacing traditional blue links.</p>
```

- Link 2-3 related posts per article
- Anchor text should be descriptive (not "click here")
- Place links naturally within sentences, not as standalone bullets

### Content Blocks to Avoid

- No `**markdown bold**` — WordPress won't render it
- No ``` code fences — use `<pre><code>` if needed (rare for business audience)
- No raw URLs — always wrap in `<a>` tags
- No emoji in body text
- No inline CSS or style attributes — rely on the theme
- No `<div>` wrappers unless absolutely necessary
- No `<br>` for spacing — use `<p>` tags for paragraph breaks

### Post Body Structure

```html
<p>Opening hook paragraph — statistic, question, or scenario.</p>

<p>Bridge paragraph — connects hook to thesis.</p>

<h2>Key Takeaways</h2>
<ul>
<li><strong>Takeaway one</strong> — scannable summary</li>
<li><strong>Takeaway two</strong> — the most important points</li>
</ul>

<h2>Why This Matters Now</h2>
<p>Context paragraphs with <strong>bold key terms</strong> and
<a href="...">internal links</a>.</p>

<h2>The Problem: [Branded Name]</h2>
<h3>Sub-problem One</h3>
<p>...</p>
<h3>Sub-problem Two</h3>
<p>...</p>

<h2>The Solution</h2>
<h3>Approach One</h3>
<p>...</p>

<h2>Comparison</h2>
<table>...</table>

<h2>Real-World Example</h2>
<p><strong>Before:</strong></p>
<ul>...</ul>
<p><strong>After:</strong></p>
<ul>...</ul>

<h2>Getting Started</h2>
<ol>
<li><strong>Step one</strong> — ...</li>
</ol>

<h2>Frequently Asked Questions</h2>
<h3>Question as heading?</h3>
<p>Answer paragraph.</p>
```

### Whitespace and Readability

- Max 3-4 sentences per paragraph
- One idea per paragraph
- Break after every H2/H3 heading (empty line before content)
- Short paragraphs > long paragraphs, always
- Single-sentence paragraphs are fine for emphasis

## Telegram Notification Design

Telegram supports limited HTML: `<b>`, `<i>`, `<u>`, `<s>`, `<code>`, `<pre>`, `<a>`. No CSS, no images inline.

### Design Principles

- **Scannable in 3 seconds** — the top line tells you if you need to read further
- **Mobile-first** — most Telegram is read on phone. Short lines, generous spacing.
- **Information density** — every line earns its place. Cut ruthlessly.

### Visual Elements

| Element | Character | Usage |
|---------|-----------|-------|
| Section divider | `―――――――――――――` | Between major sections |
| High-priority item | `⚡` | New content, urgent items |
| Regular item | `▸` | Standard list items |
| Action item | `☐` | Todos, next steps |
| Section header | Emoji + ALL CAPS | `📡 WHAT THEY DID` |
| Emphasis | `<b>bold</b>` | Keywords, names, numbers |
| Secondary | `<i>italic</i>` | Context, summaries |

### Spacing Rules

```
✅ Good — breathing room between sections:

🔔 <b>Headline here</b>

―――――――――――――
📡 SECTION ONE
―――――――――――――

▸ <b>Item</b> — detail

▸ <b>Item</b> — detail

❌ Bad — cramped, hard to scan:

🔔 <b>Headline here</b>
―――――――――――――
📡 SECTION ONE
―――――――――――――
▸ <b>Item</b> — detail
▸ <b>Item</b> — detail
```

- One blank line after every section header
- One blank line between list items if they have detail text
- No blank line between consecutive short items (slug listings)

### Bold Usage

Bold only what matters. Over-bolding makes nothing stand out.

- **Always bold**: proper names, numbers, slugs/URLs, action verbs in todos
- **Never bold**: prepositions, articles, entire sentences, section dividers
- **Limit**: Max 3-4 bold elements per section

## Social Post Design (X/Twitter)

- No hashtags (they look spammy)
- No emojis (keep it clean and professional)
- Short paragraphs, 1-2 sentences each
- Line break between each thought
- Lead with the sharpest insight, not background
- End with a strong closer, not a CTA link

## Pre-Publish Design Checklist

Before publishing any content, verify:

- [ ] **No raw markdown** — no `**`, `*`, ```` ``` ````, `#` in published HTML
- [ ] **Heading hierarchy** — H2 → H3, never skipping levels
- [ ] **At least one table** — comparison or data table in every blog post
- [ ] **Bold discipline** — key terms bolded on first mention only
- [ ] **Lists are parallel** — consistent structure across all items
- [ ] **Links are wrapped** — no raw URLs, all in `<a>` tags
- [ ] **Paragraphs are short** — max 3-4 sentences each
- [ ] **Whitespace is generous** — no walls of text
- [ ] **Telegram HTML only** — no markdown in notifications (`<b>` not `**`)
