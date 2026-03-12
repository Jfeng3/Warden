---
trigger: When auditing a blog post for SEO, doing keyword research, or checking on-page optimization
description: On-page SEO audit checklist and keyword research workflow
---
# SEO Audit

Audit blog posts for on-page SEO and research target keywords before publishing.

## On-Page SEO Checklist

Run through this checklist for every post before publishing:

### Title & Meta
- [ ] **Title tag**: Under 60 characters, includes primary keyword, compelling
- [ ] **Meta description**: 150-160 characters, includes keyword, has a call to action
- [ ] **URL slug**: Short, keyword-rich, hyphenated (e.g. `/local-ai-assistant-guide`)

### Content Structure
- [ ] **H1**: One per page, matches title intent, includes primary keyword
- [ ] **H2s**: 4-8 per post, include secondary keywords naturally
- [ ] **H3s**: Used for subsections under H2s, never skip heading levels
- [ ] **First 100 words**: Primary keyword appears naturally
- [ ] **Word count**: 2,000-3,000 words (long-form ranks better for informational queries)

### Keywords
- [ ] **Primary keyword**: Appears in title, H1, first paragraph, 1-2 H2s, conclusion
- [ ] **Keyword density**: 1-2% (natural, not stuffed)
- [ ] **Secondary keywords**: 2-3 related terms woven throughout
- [ ] **LSI keywords**: Related phrases and synonyms used naturally

### Links
- [ ] **Internal links**: Link to 2-3 other posts on openclaws.blog
- [ ] **External links**: 1-2 authoritative sources (documentation, research, reputable sites)
- [ ] **Anchor text**: Descriptive, not "click here" — use the target keyword or a natural phrase
- [ ] **Broken links**: Verify all links work

### Media
- [ ] **Images**: At least 1-2 relevant images or diagrams
- [ ] **Alt text**: Describes the image, includes keyword where natural
- [ ] **File names**: Descriptive (e.g. `local-ai-agent-architecture.png`, not `screenshot-1.png`)

### Readability
- [ ] **Short paragraphs**: 2-4 sentences max
- [ ] **Scannable**: Bold key terms, use lists and tables
- [ ] **Comparison table**: At least one per post
- [ ] **FAQ section**: 3-6 questions, targets "People Also Ask" queries

## Keyword Research Workflow

### 1. Find What People Are Asking

Use the `youdotcom-cli` skill to search for common questions and trending discussions:

```bash
# Search for common questions around a topic
curl -s "https://api.you.com/v1/agents/search?query=how+to+[topic]&freshness=month" \
  ${YDC_API_KEY:+-H "X-API-Key: $YDC_API_KEY"} | jq '.results.web[] | {title,url,description}'

# Search for comparison queries
curl -s "https://api.you.com/v1/agents/search?query=[topic]+vs&freshness=month" \
  ${YDC_API_KEY:+-H "X-API-Key: $YDC_API_KEY"} | jq '.results.web[] | {title,url,description}'

# Search for "best" queries
curl -s "https://api.you.com/v1/agents/search?query=best+[topic]&freshness=month" \
  ${YDC_API_KEY:+-H "X-API-Key: $YDC_API_KEY"} | jq '.results.web[] | {title,url,description}'
```

### 2. Analyze Search Intent

For each keyword, identify the intent:

| Intent | Signal | Content Type |
|--------|--------|--------------|
| Informational | "what is", "how to", "guide" | Blog post, tutorial |
| Comparison | "vs", "best", "alternative" | Comparison post with table |
| Transactional | "download", "install", "setup" | Tutorial with CTA |
| Navigational | Brand name, product name | Landing page or docs |

### 3. Evaluate Keyword Difficulty

Use these proxies (no paid SEO tools needed):

- **Search result quality**: Can we write something significantly better than current top results?
- **Long-tail opportunity**: More specific = easier to rank (e.g. "local ai agent mac setup" vs "ai agent")
- **Content gap**: Are existing results missing key angles or data?

### 4. Build a Keyword Cluster

For each blog post, define:
- **Primary keyword**: Main topic (1 phrase)
- **Secondary keywords**: 2-3 related terms
- **Long-tail variants**: 3-5 specific phrases
- **Questions to answer**: 3-6 "People Also Ask" style questions for FAQ

## Post-Publish SEO Check

After publishing, verify:

```bash
# Get the published post
wp post get <post-id> --field=post_content

# Check title and slug
wp post get <post-id> --fields=post_title,post_name,post_status
```

1. Visit the live URL — does it render correctly?
2. Check the page source — is the title tag and meta description correct?
3. Internal links — do 2-3 related existing posts link back to this new post?
4. Update the content calendar — mark as published
