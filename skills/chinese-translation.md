---
trigger: When translating blog posts or pages to Chinese, creating /zh versions, or maintaining Chinese content on openclaws.blog
description: Translate openclaws.blog content to Simplified Chinese and publish as /zh pages
---
# Chinese Translation

Translate every published post and page on openclaws.blog into Simplified Chinese and publish as a `/zh-` prefixed version.

## Translation Rules

### Tone & Style
- **Simplified Chinese** (简体中文), not Traditional
- Write naturally in Chinese — do NOT produce machine-translation-style output
- Match the tone of the English version: professional, conversational, accessible to non-technical business readers
- Keep branded metaphors in both English and Chinese on first use: e.g., "**Always-On Tax（持续付费陷阱）**"
- Technical terms that are commonly used in English in Chinese business contexts should keep the English with a Chinese explanation: e.g., "AI Agent（AI智能助手）", "Mac Mini", "ROI"

### What to Translate
- All body text, headings, bullet points, table content, FAQ questions and answers
- Alt text on images (if any)

### What NOT to Translate
- URLs (keep all links as-is)
- Code blocks and CLI commands
- Product names: OpenClaw, NanoClaw, V2 Cloud, Mac Mini, Mac Studio
- People's names in case studies (Sarah, James, Lisa, etc.)
- Brand names and company names

### Slug Convention
Prefix the original slug with `zh-`:

| English slug | Chinese slug |
|-------------|-------------|
| `ai-agent-deployment-checklist` | `zh-ai-agent-deployment-checklist` |
| `mac-mini-vs-cloud-vm-ai-agents-cost` | `zh-mac-mini-vs-cloud-vm-ai-agents-cost` |
| `aeo-social-listening-ai-era` | `zh-aeo-social-listening-ai-era` |
| `dedicated-mac-development-hardware` | `zh-dedicated-mac-development-hardware` |
| `mac-mini-ai-agents-home-base` | `zh-mac-mini-ai-agents-home-base` |

### Title Convention
Keep the Chinese title concise. Add the English title in parentheses if it aids SEO:

Example: `AI智能助手部署清单：从原型到生产的10个步骤`

## Translation Workflow

### Step 1: Get the English content
```bash
source .env
wp post get <post-id> --field=post_content --ssh="$WP_SSH" 2>/dev/null > /tmp/post_en.html
wp post get <post-id> --field=post_title --ssh="$WP_SSH" 2>/dev/null
```

### Step 2: Translate
Translate the full HTML content to Simplified Chinese following the rules above. Preserve all HTML tags, WordPress block comments, links, and formatting.

### Step 3: Publish as a new post
```bash
source .env
wp post create --post_title="Chinese Title Here" \
  --post_name="zh-original-slug" \
  --post_content="$(cat /tmp/post_zh.html)" \
  --post_status=publish \
  --ssh="$WP_SSH"

# IMPORTANT: Assign the Chinese category (ID 1361) so it appears on /zh-blog/ not /blog/
wp post term add <new-post-id> category chinese --ssh="$WP_SSH"
```

### Step 4: Cross-link
Add a link at the top of the Chinese post pointing to the English version:
```html
<p><a href="https://openclaws.blog/original-slug/">Read in English</a></p>
```

Add a link at the bottom of the English post pointing to the Chinese version:
```html
<p><a href="https://openclaws.blog/zh-original-slug/">阅读中文版</a></p>
```

## Pages to Translate

Also translate site pages:

| Page ID | English | Chinese slug |
|---------|---------|-------------|
| 37 | Home | Create as new page with slug `zh-home` |
| 1 | About | Create as new page with slug `zh-about` |

## Batch Translation Command

To translate all published posts at once:
```bash
# Get all published post IDs
source .env
wp post list --post_status=publish --field=ID --ssh="$WP_SSH" 2>/dev/null
```

Then loop through each ID, translate, and publish with the `zh-` prefix.

## Quality Checklist

Before publishing a Chinese translation:
- [ ] All body text is in natural Simplified Chinese (not robotic/literal translation)
- [ ] Branded metaphors show both English and Chinese
- [ ] Product names and URLs are unchanged
- [ ] HTML structure and WordPress block comments are preserved
- [ ] Cross-links added in both directions (English ↔ Chinese)
- [ ] Post slug follows `zh-` prefix convention
