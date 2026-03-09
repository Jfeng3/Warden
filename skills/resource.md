# CLAUDE.md

## Writing Style
- When referencing the cloud desktop / B2B SaaS company, always write as if it's **our own company** — never frame it as "I was monitoring a mid-market B2B SaaS company" or describe it from an outsider/analyst perspective.
- Never mention "V2Cloud" by name — just refer to it as "our B2B SaaS company" or similar.

## Competitor Website Intelligence Technique

### 1. Discover what changed (Sitemap + Wayback diffing)
- Parse `sitemap_index.xml` → find sub-sitemaps (`post-sitemap.xml`, `page-sitemap.xml`, etc.) → get lastmod dates
- Use Wayback Machine CDX API (`web.archive.org/cdx/search/cdx?url=...&output=text&fl=timestamp,statuscode`) to find historical snapshots
- Fetch old versions via `web.archive.org/web/{timestamp}/{url}`
- Strip HTML to plain text with Python (remove scripts/styles, then tags)
- Run `diff` against the live versions to see actual changes

### 2. Identify who made changes (WordPress REST API)
- Get page metadata: `/wp-json/wp/v2/pages/{id}` → exposes `author` ID, `modified` date, revision count
- Get post metadata: `/wp-json/wp/v2/posts?slug={slug}&_fields=id,author,slug`
- Cross-reference author IDs with schema.org/JSON-LD `author.name` in blog post HTML to map IDs to names
- `/wp-json/wp/v2/users` may be blocked, but author IDs on posts with known bylines serve as a lookup

### 3. Detect theme/infra deploys
- Check `bundle.min.css?v=` and `bundle.min.js?v=` query params — the `v=` value is often a Unix timestamp of the build
- Decode with `datetime.fromtimestamp()` to find exact deploy time
- Theme directory name in asset paths (e.g. `/app/themes/frogspark/`) reveals the dev agency

### 4. Daily activity log (who did what, when, on which page)

**Pull all posts modified in a date range:**
```
/wp-json/wp/v2/posts?per_page=100&modified_after={start}T00:00:00&modified_before={end}T00:00:00&_fields=id,slug,author,modified,date&orderby=modified&order=asc
```

**Pull all pages modified in a date range:**
```
/wp-json/wp/v2/pages?per_page=100&modified_after={start}T00:00:00&modified_before={end}T00:00:00&_fields=id,slug,author,modified,date&orderby=modified&order=asc
```

**Pull all posts/pages CREATED in a date range** (to distinguish new vs refresh):
```
/wp-json/wp/v2/posts?per_page=100&after={start}T00:00:00&before={end}T00:00:00&_fields=id,slug,author,date
```

**Classify each item by comparing `date` (created) vs `modified`:**
- `date` is recent (within range) → **NEW** content (original post or template-generated page)
- `date` is old, `modified` is recent → **REFRESH** (updated old content)

**Classify work type by page slug/path:**
- Blog posts with old `date` + recent `modified` → 🔄 Refresh
- Blog posts with new `date` → ✨ New content
- Pages under `/solutions/`, `/products/`, `/add-ons/`, `/integrations/` with new `date` → 📄 Template page generation
- Pages under `/fr/`, `/es/`, `/it/`, `/pt/`, `/de/` → 🌐 Translation
- Pages like `pricing`, `pricing-old` → 🔧 Pricing
- Pages like `platform`, `products`, `add-ons`, `integrations` (hub pages) → 🔧 Site structure
- Existing resource pages (about, features, help-center, etc.) → 🔧 Existing page update

**Map author IDs to names** (known for v2cloud.com):
- Author 3 = Jason (founder/CEO)
- Author 4 = Vasileios (French/partner pages)
- Author 7 = Unknown name (pricing/conversion pages)
- Author 16 = Irini Karatoliou (content/SEO)

**Check for fake translations:**
- Fetch localized pages (`/fr/`, `/es/`, etc.) and verify the body content is actually in that language, not just English copies under localized URLs

**Get revision counts** to gauge effort per item:
```
/wp-json/wp/v2/posts?slug={slug}&_fields=id,slug,_links
```
Then read `_links.version-history[0].count` for the revision number. Low revisions (1-3) = light touch or AI-generated. High revisions (15+) = heavy manual editing.
