---
trigger: When doing keyword research, checking search volume, keyword difficulty, or finding related keywords
description: Ahrefs API for keyword research — volume, difficulty, related terms, and search suggestions
name: ahrefs
allowed-tools: Bash(curl:*) Bash(jq:*)
---

# Ahrefs Keyword Research

Programmatic keyword research using the Ahrefs API. Use this to find search volume, keyword difficulty, related keywords, and long-tail variations.

## Prerequisites

```bash
# Verify tools
curl --version
jq --version

# API key must be set
echo $AHREF_API_KEY
```

The `AHREF_API_KEY` env var is required for all endpoints.

## API Reference

| Endpoint | Method | URL | Purpose |
|----------|--------|-----|---------|
| Overview | GET | `https://api.ahrefs.com/v3/keywords-explorer/overview` | Volume, difficulty, CPC for keywords |
| Related Terms | GET | `https://api.ahrefs.com/v3/keywords-explorer/related-terms` | Semantically related keywords |
| Matching Terms | GET | `https://api.ahrefs.com/v3/keywords-explorer/matching-terms` | Keywords containing the query |
| Search Suggestions | GET | `https://api.ahrefs.com/v3/keywords-explorer/search-suggestions` | Autocomplete-style suggestions |

Auth header: `Authorization: Bearer $AHREF_API_KEY`

### Available Columns for `select`

**Overview**: `volume`, `difficulty`, `cpc`, `global_volume`, `clicks`, `cps`, `parent_topic`, `parent_volume`, `traffic_potential`, `intents`, `serp_features`, `volume_monthly`, `volume_monthly_history`, `first_seen`

**Related/Matching/Suggestions**: `keyword`, `volume`, `difficulty`, `cpc`, `global_volume`, `traffic_potential`, `parent_topic`

### Common Parameters

| Param | Required | Description |
|-------|----------|-------------|
| `keywords` | Yes | URL-encoded keyword (use `+` for spaces, e.g. `how+to+get+cited`). Do NOT use Python or other tools for URL encoding — just replace spaces with `+`. Comma-separated works for single-word keywords but multi-word phrases should be queried one at a time (commas are ambiguous). |
| `country` | Yes | Country code (e.g. `us`, `gb`, `de`) |
| `select` | Yes | Comma-separated column names to return |
| `limit` | No | Max results (default varies, max 1000) |

## Examples

### Get Volume & Difficulty for Keywords

```bash
# Single keyword
curl -s "https://api.ahrefs.com/v3/keywords-explorer/overview?keywords=content+marketing&country=us&select=keyword,volume,difficulty,cpc,traffic_potential" \
  -H "Authorization: Bearer $AHREF_API_KEY" | jq '.keywords[]'

# Multiple single-word keywords (comma-separated)
curl -s "https://api.ahrefs.com/v3/keywords-explorer/overview?keywords=seo,aeo,content+marketing&country=us&select=keyword,volume,difficulty,cpc,traffic_potential" \
  -H "Authorization: Bearer $AHREF_API_KEY" | jq '.keywords[]'

# Multi-word phrases: query each separately, use + for spaces
# IMPORTANT: Just use + for spaces. Do NOT use Python or urllib for URL encoding.
for kw in "ai+content+writer" "freelance+writer+cost" "aeo+optimization"; do
  curl -s "https://api.ahrefs.com/v3/keywords-explorer/overview?keywords=${kw}&country=us&select=keyword,volume,difficulty,cpc,traffic_potential" \
    -H "Authorization: Bearer $AHREF_API_KEY" | jq '.keywords[0] // empty'
done

# To convert a variable with spaces to + encoding:
topic="how to get cited by chatgpt"
kw="${topic// /+}"
curl -s "https://api.ahrefs.com/v3/keywords-explorer/overview?keywords=${kw}&country=us&select=keyword,volume,difficulty" \
  -H "Authorization: Bearer $AHREF_API_KEY" | jq '.keywords[0] // empty'
```

Response:
```json
{
  "keyword": "content marketing",
  "volume": 822000,
  "difficulty": 89,
  "cpc": 160,
  "traffic_potential": 1200000
}
```

### Find Related Keywords

```bash
# Get semantically related keywords sorted by volume
curl -s "https://api.ahrefs.com/v3/keywords-explorer/related-terms?keywords=ai+content+marketing&country=us&select=keyword,volume,difficulty&limit=15" \
  -H "Authorization: Bearer $AHREF_API_KEY" | jq '.keywords[] | select(.volume > 0)'
```

### Find Matching Keywords (Contains Query)

```bash
# Keywords containing the query phrase
curl -s "https://api.ahrefs.com/v3/keywords-explorer/matching-terms?keywords=aeo&country=us&select=keyword,volume,difficulty&limit=15" \
  -H "Authorization: Bearer $AHREF_API_KEY" | jq '.keywords[] | select(.volume > 0)'
```

### Search Suggestions (Autocomplete)

```bash
curl -s "https://api.ahrefs.com/v3/keywords-explorer/search-suggestions?keywords=how+to+get+cited+by&country=us&select=keyword,volume,difficulty&limit=10" \
  -H "Authorization: Bearer $AHREF_API_KEY" | jq '.keywords[] | select(.volume > 0)'
```

## Keyword Research Workflow

### Step 1: Generate Candidate Keywords

From your chosen topic, brainstorm 3-5 keyword phrases that a solo operator would actually search. Think:
- "how to [topic]" (informational)
- "[topic] for small business" (audience-qualified)
- "[topic] vs [alternative]" (comparison)
- "[topic] cost" / "[topic] pricing" (transactional)

### Step 2: Check Volume & Difficulty

Call `/overview` for each candidate:

```bash
for kw in "candidate+one+phrase" "candidate+two+phrase" "candidate+three+phrase"; do
  curl -s "https://api.ahrefs.com/v3/keywords-explorer/overview?keywords=${kw}&country=us&select=keyword,volume,difficulty,cpc,traffic_potential" \
    -H "Authorization: Bearer $AHREF_API_KEY" | jq '.keywords[0] // empty'
done
```

### Step 3: Evaluate Winnability

| Difficulty | Rating | Action |
|-----------|--------|--------|
| 0-20 | Easy | Target immediately — low competition |
| 21-40 | Moderate | Good target for a niche blog — winnable with quality content |
| 41-60 | Hard | Possible with strong content + internal links — consider long-tail variant |
| 61-80 | Very Hard | Target a more specific long-tail instead |
| 81-100 | Extremely Hard | Do not target directly — find a niche angle |

**Best candidates**: volume > 50, difficulty < 50. If nothing matches, relax to volume > 10, difficulty < 70.

### Step 4: Find Long-Tail Variations

Call `/related-terms` on your best candidate:

```bash
curl -s "https://api.ahrefs.com/v3/keywords-explorer/related-terms?keywords=best+candidate+keyword&country=us&select=keyword,volume,difficulty&limit=20" \
  -H "Authorization: Bearer $AHREF_API_KEY" | jq '[.keywords[] | select(.volume > 0 and .difficulty < 50)] | sort_by(-.volume) | .[:10]'
```

Pick 2-3 as secondary keywords and 3-5 as long-tail targets.

### Step 5: Build Keyword Cluster

Save as workflow state:
- `primary_keyword` — highest volume with difficulty < 50
- `secondary_keywords` — 2-3 related terms (volume > 0, difficulty < 60)
- `long_tail_keywords` — 3-5 specific phrases
- `keyword_volume` — volume of primary keyword
- `keyword_difficulty` — difficulty score of primary keyword
- `keyword_opportunity` — "high" if primary has volume > 50 + difficulty < 40, "medium" if volume > 10 + difficulty < 60, "low" otherwise

## Security

**Allowed-tools scope** is limited to `curl` and `jq` only. Do not access endpoints other than `api.ahrefs.com` within this skill.

## Troubleshooting

| Error | Fix |
|-------|-----|
| `401` | Check `AHREF_API_KEY` is set correctly |
| `429` | Rate limit — wait and retry |
| `missing argument select` | Add `&select=keyword,volume,difficulty` to the URL |
| `arguments 'keyword_list_id', 'keywords' and 'target' cannot all be empty` | Use `keywords=` (plural), not `keyword=` |
| Empty results | Try broader search terms or different endpoint |
| `null` in results | Ahrefs has no data for that keyword — it's too niche or new. Try shorter/broader phrasing |
