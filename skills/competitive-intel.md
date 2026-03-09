---
trigger: When monitoring content competitors, analyzing rival blogs, or finding content gaps
description: Content competitor analysis for blog strategy
---
# Content Competitor Analysis

Monitor competing blogs and publications to find content gaps, trending angles, and positioning opportunities for openclaws.blog.

## Content Competitors

Key blogs and publications to monitor:

| Publication | Focus | What to Watch |
|-------------|-------|---------------|
| Cursor blog | AI coding tools | Feature announcements, tutorials, positioning |
| Aider blog/docs | Coding agent | Technical deep-dives, changelog posts |
| Continue docs/blog | IDE integration | Developer workflow content |
| Simon Willison's blog | AI tools/local LLMs | Trending topics, tool reviews |
| The Pragmatic Engineer | Developer tools | Industry trends, market analysis |
| Hacker News (front page) | Tech/startups | What resonates with developer audience |

## Monitoring Methods

### Blog & Content Scanning
```bash
# Fetch competitor blog pages for recent posts
curl -s https://aider.chat/blog/ | head -100
curl -s https://docs.cursor.com/changelog | head -100

# Search Reddit for competitor content
au reddit search "cursor vs aider" top month 10
au reddit search "best ai coding tool" top month 10

# Check HN for trending AI tool discussions
au news latest --provider hacker-news --limit 15
```

### Content Gap Analysis

When reviewing competitor content, look for:

1. **Topics they cover that we don't** → Opportunity to write our take
2. **Topics they cover poorly** → Opportunity to write a better version
3. **Questions in their comments** → Topics their audience wants but isn't getting
4. **Keywords they rank for** → Can we create competing content?

## Turning Intel into Content

When you find something notable:

1. **Competitor publishes a comparison** → Write our own with a different angle or more depth
2. **Trending topic on HN/Reddit** → Write an explainer that positions OpenClaw as relevant
3. **Community pain point in comments** → Write a tutorial addressing it
4. **Content gap** → Create the definitive resource on that topic

## Reporting Format

When reporting competitive intel, use this format:

```
## Content Competitor Scan — [Date]

### Content Gaps Found
- [Topic]: [Who's covering it] — [Our angle]

### Trending Topics
- [Topic]: [Where trending] — [Angle for openclaws.blog]

### Keyword Opportunities
- [Keyword]: [Competitor ranking] — [Can we compete?]

### Action Items
- [ ] Write: [post idea]
- [ ] Update: [existing post that needs refresh]
- [ ] Monitor: [emerging topic to keep watching]
```
