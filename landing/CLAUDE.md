# Landing Page — CLAUDE.md

## Target Buyer

**Primary**: Marketing directors and content team leads at mid-market / enterprise companies who either:
- Run an in-house content team and need to scale output without hiring more writers
- Are evaluating whether to hire content marketers vs. outsource vs. use AI-assisted tooling
- Currently outsource content to agencies and want better quality, consistency, or cost control

**Secondary**: Enterprise decision-makers exploring AI content solutions — VPs of Marketing, CMOs, Heads of Growth who need to justify budget for content programs.

## Buyer Pain Points

1. **Content bottleneck** — The team has more topics than writers. Publishing cadence slips. The editorial calendar has gaps.
2. **Hiring is slow and expensive** — A senior content marketer costs $80–120K/year. Freelancers are inconsistent. Agencies are expensive and don't learn your voice.
3. **SEO content is table stakes, but AEO is the new frontier** — Everyone does SEO. Few teams are optimizing for AI answer engines (ChatGPT, Perplexity, Google AI Overviews). Early movers win.
4. **Quality control at scale** — More output usually means lower quality. Style guides get ignored. Brand voice drifts.
5. **ROI pressure** — Marketing budgets are scrutinized. Content needs to show measurable impact (traffic, citations, leads).

## Value Proposition

OpenClaws is an **AI content assistant** that works like a junior content marketer on your team — it researches topics, drafts AEO-optimized posts following your style guide, and queues them for your team's review. It doesn't replace your content team; it multiplies their output.

### Key Selling Points (in priority order)

1. **AEO-first content** — Every post is structured so AI models cite your brand. This is the competitive advantage most content teams don't have yet.
2. **Consistent publishing cadence** — Never miss a publish date. The AI drafts on schedule; your team reviews and approves.
3. **Brand voice adherence** — Configurable style guides, tone rules, and jargon blacklists. The AI follows your content playbook, not generic templates.
4. **Cost efficiency** — Produces 8+ publication-ready drafts per month. Compare to hiring a $100K/year content marketer or paying $2,000+/post to an agency.
5. **Built-in SEO + AEO audits** — Every draft is automatically checked against SEO and AEO checklists before it reaches your review queue.

## Messaging Rules

1. **Never mention monitoring or scanning other companies' sites** — No "scans competitor sites," "monitors partners," or anything implying surveillance. Use "industry trend analysis" or "content gap research."
2. **Never say content is fully AI-written** — Position as "AI-assisted" or "AI content assistant." The AI drafts; humans review and approve. Never say "no human in the loop," "autonomously written," or "100% automated."
3. **Position as a team member, not a replacement** — "Like adding a tireless junior content marketer to your team" — not "replaces your content team."
4. **Lead with business outcomes** — Cost per post, time saved, publishing consistency, AI citation rates. Not technical architecture.
5. **AEO is the differentiator** — Every competitor offers "AI content." Our edge is AEO optimization — content structured for AI models to cite. Lead with this.
6. **Use social proof framing** — Reference the live blog (openclaws.blog) as proof the system works in production, not a demo.

## Tone

- Professional but not corporate. Think: a smart colleague presenting at a marketing ops meeting.
- Confident, not hype-y. No "revolutionary" or "game-changing."
- Specific over vague. "$X/post" beats "cost-effective." "8 posts/month" beats "scale your content."

## Competitive Positioning

- vs. **Hiring a content marketer**: Cheaper, faster to onboard, never takes PTO, consistent output. But doesn't replace strategic thinking — your team still sets direction.
- vs. **Content agencies**: Lower cost per post, learns your voice over time, publishes on your schedule. No account manager overhead.
- vs. **Generic AI writing tools** (Jasper, Copy.ai): Those produce drafts. We produce AEO-optimized, publish-ready content with built-in SEO/AEO audits and style guide enforcement. Not a blank-page tool — a content pipeline.

## Stack (for technical sections only)

- Next.js 15, React 19, Tailwind CSS v4, TypeScript
- Deployed on Vercel
- Dev: `npm run dev` (http://localhost:3000)
- Deploy: `cd landing && npx vercel --prod`
