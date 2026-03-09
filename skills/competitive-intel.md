---
trigger: When monitoring content competitors, analyzing rival blogs, detecting site changes, or generating daily topic ideas
description: Content competitor monitoring via WordPress REST API and sitemap diffing
---
# Content Competitor Analysis

Monitor competing WordPress sites to detect new pages, content refreshes, and strategic shifts — then generate daily topic ideas for openclaws.blog.

## Primary Monitoring Target

| Site | Base URL | Focus | Why We Monitor |
|------|----------|-------|----------------|
| V2 Cloud | v2cloud.com | Cloud VDI, AI agent hosting | Same audience (AI agent builders), complementary positioning, co-marketing target |

## WordPress REST API Monitoring

The primary method for detecting site changes. Most WordPress sites expose their REST API publicly.

### Pull all posts/pages modified in a date range

```bash
# Posts modified today (replace dates as needed)
curl -s "https://v2cloud.com/wp-json/wp/v2/posts?per_page=100&modified_after=2026-03-08T00:00:00&modified_before=2026-03-09T00:00:00&_fields=id,slug,author,modified,date&orderby=modified&order=asc"

# Pages modified today
curl -s "https://v2cloud.com/wp-json/wp/v2/pages?per_page=100&modified_after=2026-03-08T00:00:00&modified_before=2026-03-09T00:00:00&_fields=id,slug,author,modified,date&orderby=modified&order=asc"
```

### Pull all posts/pages CREATED in a date range (new vs refresh)

```bash
# New posts created this week
curl -s "https://v2cloud.com/wp-json/wp/v2/posts?per_page=100&after=2026-03-01T00:00:00&before=2026-03-09T00:00:00&_fields=id,slug,author,date"

# New pages created this week
curl -s "https://v2cloud.com/wp-json/wp/v2/pages?per_page=100&after=2026-03-01T00:00:00&before=2026-03-09T00:00:00&_fields=id,slug,author,date"
```

### Classify each item

Compare `date` (created) vs `modified` to determine change type:

| Condition | Classification |
|-----------|---------------|
| `date` is recent (within range) | ✨ **NEW** content |
| `date` is old, `modified` is recent | 🔄 **REFRESH** (updated old content) |

### Classify work type by slug/path

| Slug pattern | Type |
|-------------|------|
| Blog posts with old `date` + recent `modified` | 🔄 Content refresh |
| Blog posts with new `date` | ✨ New blog content |
| Pages under `/solutions/`, `/products/`, `/add-ons/` with new `date` | 📄 Template page generation |
| Pages under `/fr/`, `/es/`, `/it/`, `/pt/`, `/de/` | 🌐 Translation |
| Pages like `platform`, `products`, `integrations` (hub pages) | 🔧 Site structure / SEO architecture |

### Known V2Cloud author IDs

| Author ID | Name | Role |
|-----------|------|------|
| 3 | Jason | Founder/CEO |
| 4 | Vasileios | French/partner pages |
| 7 | Unknown | Pricing/conversion pages |
| 16 | Irini Karatoliou | Content/SEO |

### Get revision counts (effort indicator)

```bash
curl -s "https://v2cloud.com/wp-json/wp/v2/posts?slug=SLUG_HERE&_fields=id,slug,_links"
```

Read `_links.version-history[0].count`:
- 1-3 revisions = light touch or AI-generated
- 15+ revisions = heavy manual editing

## Sitemap Diffing (Broader Change Detection)

For catching changes the REST API might miss (e.g., non-WordPress pages, removed pages):

```bash
# Fetch sitemap index
curl -s https://v2cloud.com/sitemap_index.xml

# Fetch individual sitemaps and check lastmod dates
curl -s https://v2cloud.com/post-sitemap.xml
curl -s https://v2cloud.com/page-sitemap.xml
curl -s https://v2cloud.com/solution-sitemap.xml
```

### Wayback Machine diffing (what changed in a page)

```bash
# Find historical snapshots of a specific page
curl -s "https://web.archive.org/cdx/search/cdx?url=v2cloud.com/blog/SLUG&output=text&fl=timestamp,statuscode"

# Fetch an old version
curl -s "https://web.archive.org/web/TIMESTAMP/https://v2cloud.com/blog/SLUG"
```

Compare old vs live content to see what was added, removed, or rewritten.

## Daily Topic Generation Workflow

Run this workflow daily. For each change detected, generate a topic idea for openclaws.blog.

### Step 1: Detect changes

Query the WordPress REST API for posts and pages modified in the last 24 hours. Classify each as NEW or REFRESH.

### Step 2: Fetch and analyze changed content

For each new or refreshed page, fetch the live content and identify:
- **Primary keyword** they're targeting
- **Content angle** (tutorial, comparison, thought leadership, product page)
- **Audience segment** (enterprise IT, developers, MSPs, remote workers)

### Step 3: Generate topic ideas using this matrix

| Their change type | Our response |
|-------------------|-------------|
| ✨ New blog post on topic X | Write a complementary or counter-perspective post on topic X |
| ✨ New solutions/product page | Write a "how to do X without cloud vendor lock-in" alternative |
| 🔄 Refreshed old post | Check if we have competing content — if so, refresh ours too; if not, write our take |
| 📄 New template pages (bulk) | Identify the keyword cluster they're targeting → write a definitive guide covering that cluster |
| 🔧 New hub/structure page | They're building topic authority — write content that links to/from the same topic cluster |

### Step 4: Score and prioritize

For each topic idea, score on:
1. **Keyword overlap** (1-5): Does this target the same searches as their content?
2. **Content gap** (1-5): How different is our angle from theirs?
3. **Co-marketing potential** (1-5): Would they want to cross-link this?
4. **Our expertise fit** (1-5): Can we write this authentically?

Prioritize topics scoring 15+ out of 20.

## Reporting Format

```
## Daily Competitor Scan — [Date]

### Changes Detected
| Type | Slug | Author | Notes |
|------|------|--------|-------|
| ✨/🔄 | slug-here | Name | What changed |

### Topic Ideas Generated
| Priority | Topic | Their trigger | Our angle | Co-marketing potential |
|----------|-------|---------------|-----------|----------------------|
| High/Med/Low | "Title idea" | What they published | How we'd write it differently | Could they cross-link? |

### Action Items
- [ ] Draft: [highest priority topic]
- [ ] Refresh: [our existing post that needs updating]
- [ ] Pitch: [co-marketing opportunity to propose]
```

## Other Content Competitors

Also monitor periodically (weekly, not daily):

| Publication | Method | What to Watch |
|-------------|--------|---------------|
| Cursor blog | `curl -s https://docs.cursor.com/changelog` | Feature announcements, positioning |
| Aider blog | `curl -s https://aider.chat/blog/` | Technical deep-dives |
| Simon Willison's blog | `curl -s https://simonwillison.net/` | Trending AI tool topics |
| HN front page | `au news latest --provider hacker-news --limit 15` | What resonates with dev audience |
| Reddit | `au reddit hot LocalLLaMA 10` | Community pain points, trending discussions |

## Scheduling

Set up cron jobs to automate monitoring:

```bash
# Daily V2Cloud scan at 8am PT
npx tsx src/cron-cli.ts add --name "daily-v2cloud-scan" --cron "0 8 * * *" --tz "America/Los_Angeles" --instruction "Use the competitive-intel skill. Query the V2Cloud WordPress REST API for posts and pages modified in the last 24 hours (use today's date). For each change detected, classify it (new vs refresh), fetch the content, and generate 1-2 topic ideas for openclaws.blog. Report findings using the Daily Competitor Scan format."

# Weekly broader competitor scan on Mondays at 9am PT
npx tsx src/cron-cli.ts add --name "weekly-competitor-scan" --cron "0 9 * * MON" --tz "America/Los_Angeles" --instruction "Use the competitive-intel skill. Check Cursor changelog, Aider blog, HN front page, and Reddit r/LocalLLaMA for notable content from the past week. Generate 2-3 topic ideas for openclaws.blog and report using the Daily Competitor Scan format."
```
