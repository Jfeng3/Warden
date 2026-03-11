---
trigger: When pulling Google Search Console data, analyzing SEO performance, or running the weekly GSC report
description: Google Search Console data analysis and reporting
---
# Google Search Console

Use the `gsc` tool to pull search performance data for openclaws.blog.

## Available Actions

| Action | What it returns | When to use |
|--------|----------------|-------------|
| `topQueries` | Top search queries by clicks, with impressions, CTR, position | Weekly reports, keyword tracking |
| `topPages` | Top pages by clicks, with impressions, CTR, position | Identify best/worst performing content |
| `indexStatus` | Index coverage for a specific URL | Check if a new post is indexed |
| `sitemaps` | Submitted sitemaps and their status | Verify sitemap health |

## How to Use

```
gsc({ action: "topQueries", days: 7, limit: 15 })
gsc({ action: "topPages", days: 7, limit: 10 })
gsc({ action: "indexStatus", url: "https://openclaws.blog/2026/03/09/ai-agent-costs-at-scale/" })
gsc({ action: "sitemaps" })
```

## Understanding the Metrics

| Metric | What it means | Good benchmark |
|--------|--------------|----------------|
| **Clicks** | Times a user clicked through to our page | More is better |
| **Impressions** | Times our page appeared in search results | Shows visibility |
| **CTR** | Click-through rate (clicks / impressions) | 3-5% is average; >5% is good |
| **Position** | Average ranking position in Google | 1-3 is top; 4-10 is page 1; >10 is page 2+ |

## Analysis Playbook

### Weekly Report

1. Pull `topQueries` (7 days, limit 15) and `topPages` (7 days, limit 10)
2. Identify:
   - **Winners**: queries with position < 5 and rising clicks
   - **Opportunities**: queries with high impressions but low CTR (position 4-10) — these need title/meta optimization
   - **Quick wins**: queries at position 8-15 — a small content improvement could push them to page 1
3. Check if any recent posts are missing from `topPages` — they might not be indexed yet
4. For missing posts, run `indexStatus` to verify

### Optimization Signals

| Signal | What it means | Action |
|--------|--------------|--------|
| High impressions, low CTR | Google shows us but users don't click | Improve title tag and meta description |
| Position 8-15 | Almost on page 1 | Add content depth, internal links, refresh the post |
| Position 1-3, declining clicks | Competitors overtaking or seasonality | Check for new competing content |
| Page not in topPages | Either not indexed or not ranking | Run indexStatus, check for crawl issues |

### Telegram Report Format

Follow the notification skill's formatting rules. Structure:

```
GSC WEEKLY REPORT (Mar 3-10)

TOP QUERIES
[paste topQueries output]

TOP PAGES
[paste topPages output]

OPPORTUNITIES
List queries with high impressions but low CTR — these are the quick wins.

ACTION ITEMS
List 2-3 specific recommendations.
```

## Data Lag

GSC data is delayed by 2-3 days. When pulling 7-day data, you're seeing performance from roughly 4-10 days ago. This is normal and expected.
