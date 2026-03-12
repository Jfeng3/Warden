---
trigger: When writing or editing blog content for openclaws.blog
description: Writing style guide for openclaws.blog blog posts
---
# Content Style Guide

When writing blog posts for openclaws.blog, follow this structure and style consistently.

## Product Messaging

**OpenClaw** — Your own personal AI assistant. Any OS. Any Platform. The lobster way. Open-source, runs locally, privacy-first.
- Key angles: local-first AI, open-source alternative to closed assistants, cross-platform, extensible
- GitHub: https://github.com/openclaw/openclaw

**Warden** — A CLI agent that runs 24/7, automates workflows, publishes content, and monitors the competitive landscape.
- Key angles: always-on automation, CLI-native, task queue architecture, self-hosted
- GitHub: https://github.com/qwibitai/warden (or link to actual repo)

When writing about these products, emphasize: business efficiency, cost savings, privacy/data sovereignty, always-on reliability, and practical automation that non-technical teams can benefit from.

## Structure Template

```
H1: Title (compelling, benefit-driven or question-based)

Opening Hook (2-3 paragraphs)
  - Lead with a statistic, market data, or compelling question
  - Establish the problem or opportunity
  - Bridge to your thesis

H2: Key Takeaways
  - 3-5 bullet points summarizing the post's main points
  - Scannable preview for skimmers

H2: Context / Why This Matters
  - Market trends, adoption data, or industry context
  - External citations where possible

H2: The Problem
  - Specific pain points with bold key terms
  - H3 subsections for each pain point (2-4)

H2: The Solution
  - H3 subsections for each benefit (2-4)
  - Bold key concepts on first mention
  - Use case examples within subsections

H2: Comparison (table)
  - At least one comparison table (3+ columns, 5+ rows)
  - Compare your approach vs alternatives

H2: Real-World Example
  - Narrative case study with a named persona
  - Before/after structure showing concrete improvement

H2: Getting Started / Implementation
  - Numbered steps (3-5)
  - Practical, actionable guidance

H2: Frequently Asked Questions
  - 3-6 Q&A pairs
  - Address common objections and clarifications
  - 50-150 words per answer
```

## Target Audience

Our audience matches V2Cloud.com's readers: **non-technical business professionals** at small-to-medium businesses.

- **Primary personas**: IT managers, business owners, SMB decision-makers, marketing leaders
- **Technical level**: Low-to-moderate. Assume readers understand business concepts but NOT developer tools.
- **Their questions**: "Should my team adopt this?" not "How do I deploy this?"
- **Industries**: Healthcare, education, finance, marketing agencies, engineering firms

### Audience Rules

- **NEVER use unexplained jargon**: No SSH, Docker, pm2, pyenv, webpack, API keys, vCPUs, egress bandwidth, ACID transactions, or similar developer terms without inline plain-language explanation
- **Replace developer terms** with business equivalents:
  - SSH → "remote access"
  - API keys → "service credentials (the digital passwords that connect your tools)"
  - vCPUs → "virtual processors"
  - Egress bandwidth → "data transfer fees"
  - Noisy neighbors → "other users competing for the same resources"
  - IAM/networking → "security configuration"
  - Process manager → "automatic restart software"
- **Introduce branded metaphors** and repeat them as anchors throughout the post (V2Cloud style):
  - Examples: "The Infrastructure Gap", "The Always-On Tax", "The Laptop Trap", "The Deployment Desert", "The Separation Principle"
  - Bold on first use, then reference naturally throughout
- **Explain concepts inline** using parenthetical definitions: "Total Cost of Ownership (what you actually pay when you add up every expense over time)"
- **Frame everything as business outcomes**: revenue impact, time saved, client satisfaction, billable hours recovered — not technical elegance
- **Case study personas** should be business roles: agency owners, marketing VPs, operations managers — not developers or engineers

## Writing Style

- **Tone**: Professional yet conversational. Use second-person ("you") and rhetorical questions.
- **Voice**: Active voice. "An AI agent processes your data" not "Your data is processed by an AI agent."
- **Bold**: Use bold for key terms on first mention, critical statements, and section emphasis.
- **Sentence length**: Mix short punchy statements with longer explanatory ones.
- **Word count**: Target 2,000-3,000 words. No section should exceed ~600 words.

## Formatting Rules

- **Headings**: H1 for title, H2 for major sections, H3 for subsections. Never skip levels.
- **Lists**: Bulleted for features/benefits, numbered for steps/sequences.
- **Tables**: At least one comparison table per post.
- **Bold patterns**: Key terms, concept names, critical economic arguments.
- **No emojis** in body text.

## Narrative Pattern

Every post follows: **Problem → Solution → Proof → Action**

1. **Problem**: Identify a real pain point with specifics (not vague)
2. **Solution**: Present the approach with clear benefits
3. **Proof**: Case study, comparison table, or data backing the claim
4. **Action**: Getting started steps + FAQ to remove objections

## Topic Selection: Problem-First Approach

Every topic must start from a **real problem people are searching for** — never from a product feature or technology name.

### The rule
- **Wrong**: "Why Mac Mini is great for AI agents" (product-first)
- **Right**: "My automation stops every time I close my laptop" (problem-first)
- **Wrong**: "OpenClaw features overview" (feature-first)
- **Right**: "How to keep your business running 24/7 without hiring night staff" (problem-first)

### How to find problem-first topics
1. **What are people complaining about?** Check Reddit, forums, support threads — real frustrations in real language
2. **What are they Googling?** "How to..." and "Why does..." queries reveal problems. "Best X for Y" reveals decisions.
3. **What does V2Cloud's audience struggle with?** Slow laptops, expensive cloud bills, security worries, scaling without hiring
4. **What would someone ask their IT person?** That's the title of your post.

### Topic framing formula
```
[Audience's problem] → [Why it's getting worse] → [Our solution approach]
```

Examples:
| Problem people have | Our angle |
|--------------------|-----------|
| "My laptop freezes when I run AI tools and Zoom at the same time" | Dedicated hardware separates workloads |
| "Cloud bills keep going up and I can't predict costs" | One-time hardware vs monthly subscriptions |
| "I don't know if AI automation is safe for my business data" | Physical isolation = simplest security model |
| "My competitor is showing up in AI search results and I'm not" | AEO strategy for brand control |
| "I want to automate but I'm not technical" | No-code agent setup on Mac Mini |

### Title test
Before writing, ask: **"Would a business owner type this into Google?"** If no, reframe until the answer is yes.

## Opening Hook Formulas

- Statistic + source: "Eight out of ten companies have already..."
- Rhetorical question: "Who wouldn't want a digital workforce that never sleeps?"
- Scenario: "It's Monday morning. Your laptop is already grinding..."
- Contrast: "Your laptop is great for building agents. It's terrible for running them."

## CTA Placement

- One mid-content CTA after the solution section (link to related post or project)
- One closing CTA before FAQ (subscription, GitHub link, or related reading)

## SEO Checklist

Before publishing, verify:

- [ ] **Title tag**: Under 60 characters, includes primary keyword, compelling
- [ ] **Meta description**: 150-160 characters, includes keyword, has a call to action
- [ ] **URL slug**: Short, keyword-rich, hyphenated (e.g. `/local-ai-assistant-guide`)
- [ ] **H1**: Matches title tag intent (can differ slightly for readability)
- [ ] **Internal links**: Link to at least 2 other posts on openclaws.blog
- [ ] **External links**: Cite at least 1-2 authoritative sources
- [ ] **Images**: Alt text describes the image and includes keyword where natural
- [ ] **Target keyword**: Appears in first 100 words, H2, and naturally throughout
