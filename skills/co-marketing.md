---
trigger: When monitoring V2Cloud content, generating co-marketing topic ideas, or preparing for weekly partner sync
description: V2Cloud co-marketing partner monitoring via WordPress REST API and sitemap diffing
---
# Co-Marketing Partner Monitoring

Monitor V2Cloud's site to detect new pages, content refreshes, and strategic shifts — then generate **complementary** topic ideas for openclaws.blog that both sites benefit from.

**IMPORTANT**: V2Cloud is a co-marketing partner, NOT a competitor. We meet their content marketing manager weekly. All topic ideas must pass this test: "Would V2Cloud's content team happily cross-link to this post?" If the answer is no, don't write it.

## Primary Monitoring Target

| Site | Base URL | Focus | Why We Monitor |
|------|----------|-------|----------------|
| V2 Cloud | v2cloud.com | Cloud VDI, AI agent hosting | Co-marketing partner. Same audience (SMB decision-makers). Weekly sync with their content marketing manager. |

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

Use **all three methods** to catch changes comprehensively:

**Method 1 — WordPress REST API** (primary): Query for posts and pages modified in the last 24 hours. Classify each as NEW or REFRESH by comparing `date` vs `modified`.

**Method 2 — Sitemap lastmod** (catch non-blog changes): Fetch `https://v2cloud.com/sitemap_index.xml` and check lastmod dates on each sub-sitemap. If any sitemap was updated in the last 24 hours, fetch it and identify which URLs changed. This catches pages the REST API might miss (solutions, applications, custom post types).

**Method 3 — Wayback Machine diffing** (understand what changed): For significant changes found in Methods 1-2, check if a Wayback snapshot exists from before the change:
```bash
curl -s "https://web.archive.org/cdx/search/cdx?url=v2cloud.com/blog/SLUG&output=text&fl=timestamp,statuscode&limit=3"
```
Compare old vs live content to identify what was added, removed, or rewritten.

### Step 2: Fetch and analyze changed content

For each new or refreshed page, fetch the live content and identify:
- **Primary keyword** they're targeting
- **Content angle** (tutorial, comparison, thought leadership, product page)
- **Audience segment** (enterprise IT, developers, MSPs, remote workers)

### Step 3: Generate complementary topic ideas

**Golden rule**: Every topic must strengthen BOTH sites. We write about the "why" and "how to think about it"; V2Cloud writes about the "how to do it with our platform." Together we own the topic.

| Their change type | Our complementary response |
|-------------------|---------------------------|
| ✨ New blog post on topic X | Write a broader industry perspective that links to their post as a solution example |
| ✨ New product/solution page | Write a "business case for [category]" post that naturally references their offering |
| 🔄 Refreshed old post | Write a fresh take on the same topic from a different angle they can cross-link to |
| 📄 New template pages (bulk) | Write a definitive guide for that keyword cluster — they link to us for education, we link to them for implementation |
| 🔧 New hub/structure page | Write thought leadership content in that topic cluster that complements their product pages |

**Never write**: "You don't need X" where X is something V2Cloud sells. Instead write: "How to evaluate X for your business" and include them as an option.

### Step 4: Score and prioritize

For each topic idea, score on:
1. **Cross-link value** (1-5): Would V2Cloud's team want to link to this from their site?
2. **Audience overlap** (1-5): Does this reach the same SMB decision-makers both sites target?
3. **Content gap** (1-5): Does this fill a gap neither site currently covers?
4. **Our expertise fit** (1-5): Can we write this authentically?

Prioritize topics scoring 15+ out of 20. **Reject any topic scoring below 3 on cross-link value.**

## Reporting Format

```
## Daily Partner Scan — [Date]

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

## Detecting Theme/Infrastructure Deploys

Check CSS/JS asset URLs for version query params that reveal deploy times:
```bash
# Look for ?v= params in page source — often Unix timestamps of the build
curl -s https://v2cloud.com | grep -o 'bundle\.\(min\.\)\?[cj]ss?v=[0-9]*'
```
Theme directory name in asset paths (e.g. `/app/themes/frogspark/`) reveals the dev agency.

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
npx tsx src/cron-cli.ts add --name "daily-v2cloud-scan" --cron "0 8 * * *" --tz "America/Los_Angeles" --instruction "Use the co-marketing skill. Query the V2Cloud WordPress REST API for posts and pages modified in the last 24 hours (use today's date). For each change detected, classify it (new vs refresh), fetch the content, and generate 1-2 topic ideas for openclaws.blog. Report findings using the Daily Partner Scan format."

# Weekly broader competitor scan on Mondays at 9am PT
npx tsx src/cron-cli.ts add --name "weekly-competitor-scan" --cron "0 9 * * MON" --tz "America/Los_Angeles" --instruction "Use the co-marketing skill. Check Cursor changelog, Aider blog, HN front page, and Reddit r/LocalLLaMA for notable content from the past week. Generate 2-3 topic ideas for openclaws.blog and report using the Daily Partner Scan format."
```
