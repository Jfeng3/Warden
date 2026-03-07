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
```

## Post Statuses

`draft` (default), `publish` (live), `future` (scheduled, requires --post_date), `pending` (awaiting review), `private` (admin-only).

## Tips

- For long posts, write content as HTML in a temp file, then pass it to `wp post create`. This avoids shell escaping issues.
- Use `--porcelain` to get just the post ID for scripting.

```bash
wp post create /tmp/post-content.html --post_title="My Post" --post_status=publish --porcelain --ssh="$WP_SSH"
```
