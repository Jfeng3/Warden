---
trigger: When publishing, updating, or managing blog posts on openclaws.blog via wp-cli
description: wp-cli reference for publishing to openclaws.blog
---
# WordPress / Blog Publishing

Publish and manage blog posts on openclaws.blog using wp-cli over SSH. The connection is configured via the `WP_SSH` env var. Before running wp commands, verify it is set: `[ -z "$WP_SSH" ] && echo "WP_SSH not configured" && exit 1`.

## Commands

```bash
# Create and publish a post (--porcelain returns just the post ID)
wp post create --post_title="My Post" --post_content="Body here..." --post_status=publish --porcelain --ssh="$WP_SSH"

# Create a draft for review
wp post create --post_title="Draft Post" --post_content="Work in progress..." --post_status=draft --ssh="$WP_SSH"

# Schedule a future post (--post_date uses the WordPress site timezone, not UTC)
wp post create --post_title="Scheduled Post" --post_content="Publishes later" --post_status=future --post_date="2026-04-01 08:00:00" --porcelain --ssh="$WP_SSH"

# Create a post from a file (useful for long content)
wp post create ./content.html --post_title="From File" --post_status=publish --ssh="$WP_SSH"

# List posts
wp post list --post_status=publish --fields=ID,post_title,post_date,post_status --ssh="$WP_SSH"
wp post list --post_status=draft --ssh="$WP_SSH"

# Update an existing post
wp post update <post-id> --post_title="New Title" --post_status=publish --ssh="$WP_SSH"

# Publish a draft
wp post update <post-id> --post_status=publish --ssh="$WP_SSH"

# Move a post to trash
wp post delete <post-id> --ssh="$WP_SSH"

# Permanently delete a post (skip trash)
wp post delete <post-id> --force --ssh="$WP_SSH"

# Add a featured image
wp media import ./image.jpg --post_id=<post-id> --featured_image --ssh="$WP_SSH"

# Get a post's full content
wp post get <post-id> --field=post_content --ssh="$WP_SSH"

# Add categories and tags
wp post create --post_title="Tagged Post" --post_content="..." --post_status=publish --post_category=1,2 --tags_input="tech,tutorial" --ssh="$WP_SSH"

# Add a category to an existing post
wp post term add <post-id> category <slug> --ssh="$WP_SSH"
```

## Language Categories

The blog uses categories to separate English and Chinese content on the blog listing pages:

| Category | ID | Slug | Purpose |
|----------|-----|------|---------|
| English | 1362 | `english` | Assigned to all English posts |
| Chinese | 1361 | `chinese` | Assigned to all Chinese (`zh-`) posts |

**When publishing a new English post**, always assign the `english` category:
```bash
wp post term add <post-id> category english --ssh="$WP_SSH"
```

**When publishing a Chinese translation**, always assign the `chinese` category:
```bash
wp post term add <post-id> category chinese --ssh="$WP_SSH"
```

The `/blog/` page uses a Query Loop block filtered to category 1362 (English only).
The `/zh-blog/` page uses a Query Loop block filtered to category 1361 (Chinese only).

## Updating Pages (Homepage, About, etc.)

Pages work the same as posts — they're just posts with a different type. Use the same `wp post update` command.

```bash
# Known page IDs on openclaws.blog:
#   37 = Home (homepage content, hero, value propositions)
#   1  = About (about page)
#   38 = Blog (blog listing page — Query Loop filtered to English category)
#   64 = zh-home (Chinese homepage)
#   65 = zh-about (Chinese about page)
#   81 = zh-blog (Chinese blog listing — Query Loop filtered to Chinese category)

# Update homepage content
wp post update 37 --post_content="$(cat /tmp/homepage.html)" --ssh="$WP_SSH"

# Update about page
wp post update 1 --post_content="$(cat /tmp/about.html)" --ssh="$WP_SSH"

# List all pages
wp post list --post_type=page --fields=ID,post_title,post_status --ssh="$WP_SSH"
```

## Updating Site Settings (Tagline, etc.)

`wp option update` works over SSH for WordPress.com:

```bash
# Update site tagline
wp option update blogdescription "AI automation guides for business owners and IT leaders" --ssh="$WP_SSH"

# Update site title
wp option update blogname "OpenClaws" --ssh="$WP_SSH"
```

**Note:** Some wp-cli commands (like `wp theme`, `wp plugin`) do NOT work on WordPress.com SSH. The following DO work: `wp post`, `wp option update`, `wp media`.

## Post Statuses

`draft` (default), `publish` (live), `future` (scheduled, requires --post_date), `pending` (awaiting review), `private` (admin-only).

## Tips

- For long posts, write content as HTML in a temp file, then pass it to `wp post create`. This avoids shell escaping issues.
- Use `--porcelain` to get just the post ID for scripting.

```bash
wp post create /tmp/post-content.html --post_title="My Post" --post_status=publish --porcelain --ssh="$WP_SSH"
```

## Post-Publish Checklist

After publishing a post:

1. **Verify live**: Visit the post URL and confirm it renders correctly
2. **Share to social**: Use the `social-distribution` skill to draft social posts for Reddit, X, and HN
3. **Update internal links**: Check 2-3 related existing posts and add a link to the new post
4. **Update content calendar**: Mark the topic as published in the editorial calendar
