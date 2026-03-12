---
trigger: When publishing, updating, or managing blog posts on openclaws.blog via wp-cli
description: wp-cli reference for publishing to openclaws.blog
---
# WordPress / Blog Publishing

Publish and manage blog posts on openclaws.blog using the **`wp` tool** (NOT bash). The `wp` tool handles SSH connection automatically via the `WP_SSH` env var — you do NOT need to pass `--ssh` or check if `WP_SSH` is set.

**IMPORTANT**: Always use the `wp` tool, never `bash`, for WordPress commands. The `wp` tool takes a command string without the leading "wp" and without `--ssh`. For example: `wp(command="post list --post_status=publish")`.

## Commands

**IMPORTANT**: Every post MUST be assigned a language category after creation, or it will NOT appear on the blog listing pages or homepage. See "Language Categories" below. Always run `wp post term set <post-id> category english` (or `chinese`) immediately after creating a post. Use the **slug** (`english`/`chinese`), NOT the numeric term ID — wp-cli treats numbers as names, not IDs.

All examples below use the `wp` tool. Do NOT add `--ssh` — the tool handles it automatically.

```
# Create and publish a post (--porcelain returns just the post ID)
# ALWAYS assign category after — see Language Categories section
wp(command='post create --post_title="My Post" --post_content="Body here..." --post_status=publish --porcelain')

# Create a draft for review
wp(command='post create --post_title="Draft Post" --post_content="Work in progress..." --post_status=draft --porcelain')

# Create a post from a local HTML file (REQUIRED for long content like blog posts)
# Use "-" in the command to read from stdin, and content_file to specify the local file
wp(command='post create - --post_title="From File" --post_status=draft --porcelain', content_file='./content.html')

# List posts
wp(command='post list --post_status=publish --fields=ID,post_title,post_date,post_status')
wp(command='post list --post_status=draft --fields=ID,post_title,post_date')

# Update an existing post
wp(command='post update <post-id> --post_title="New Title" --post_status=publish')

# Publish a draft
wp(command='post update <post-id> --post_status=publish')

# Move a post to trash
wp(command='post delete <post-id>')

# Permanently delete a post (skip trash)
wp(command='post delete <post-id> --force')

# Add a featured image
wp(command='media import ./image.jpg --post_id=<post-id> --featured_image')

# Get a post's full content
wp(command='post get <post-id> --field=post_content')

# Add categories and tags
wp(command='post create --post_title="Tagged Post" --post_content="..." --post_status=publish --post_category=1,2 --tags_input="tech,tutorial" --porcelain')

# Add a category to an existing post
wp(command='post term add <post-id> category <slug>')
```

## Language Categories

The blog uses categories to separate English and Chinese content on the blog listing pages:

| Category | ID | Slug | Purpose |
|----------|-----|------|---------|
| English | 1362 | `english` | Assigned to all English posts |
| Chinese | 1361 | `chinese` | Assigned to all Chinese (`zh-`) posts |

**When publishing a new English post**, always assign the `english` category:
```
wp(command='post term set <post-id> category english')
```

**When publishing a Chinese translation**, always assign the `chinese` category:
```
wp(command='post term set <post-id> category chinese')
```

The `/blog/` page uses a Query Loop block filtered to category 1362 (English only).
The `/zh-blog/` page uses a Query Loop block filtered to category 1361 (Chinese only).

## Updating Pages (Homepage, About, etc.)

Pages work the same as posts — they're just posts with a different type. Use the same `wp post update` command.

```
# Known page IDs on openclaws.blog:
#   37 = Home (homepage content, hero, value propositions)
#   1  = About (about page)
#   38 = Blog (blog listing page — Query Loop filtered to English category)
#   64 = zh-home (Chinese homepage)
#   65 = zh-about (Chinese about page)
#   81 = zh-blog (Chinese blog listing — Query Loop filtered to Chinese category)

# Update homepage content (write HTML to file first, then reference it)
wp(command='post update 37 /tmp/homepage.html')

# Update about page
wp(command='post update 1 /tmp/about.html')

# List all pages
wp(command='post list --post_type=page --fields=ID,post_title,post_status')
```

## Updating Site Settings (Tagline, etc.)

`wp option update` works over SSH for WordPress.com:

```
wp(command='option update blogdescription "AI automation guides for business owners and IT leaders"')
wp(command='option update blogname "OpenClaws"')
```

**Note:** Some wp-cli commands (like `wp theme`, `wp plugin`) do NOT work on WordPress.com SSH. The following DO work: `wp post`, `wp option update`, `wp media`.

## Draft-Review-Publish Workflow

When a cron job has `publish_mode: "draft"`, the agent should create posts as drafts instead of publishing immediately. The `publish_mode` value is passed in the task's metadata.

### How it works

1. **Check metadata**: If `metadata.publish_mode === "draft"`, use `--post_status=draft` instead of `--post_status=publish`
2. **Notify for review**: After creating the draft, send a Telegram message with the draft title and post ID
3. **Telegram commands** for reviewers:
   - `/drafts` — list all current WordPress drafts
   - `/approve <post-id>` — publish a draft: sets status to `publish`
   - `/reject <post-id>` — trash a draft: sets status to `trash`

### Setting draft mode on a cron job

```bash
# Create a cron job in draft mode
npx tsx src/cron-cli.ts add --name "blog-publish" --cron "0 9 * * WED,SUN" \
  --tz "America/Los_Angeles" --publish-mode draft \
  --metadata '{"source":"telegram","chatId":7823756809}' \
  --instruction "Write and publish a blog post..."

# Switch an existing cron job to draft mode
npx tsx src/cron-cli.ts update <id> --publish-mode draft

# Switch back to auto-publish
npx tsx src/cron-cli.ts update <id> --publish-mode auto
```

## Post Statuses

`draft` (default), `publish` (live), `future` (scheduled, requires --post_date), `pending` (awaiting review), `private` (admin-only).

## Tips

- **WordPress does NOT render markdown.** All post content must be HTML (`<p>`, `<h2>`, `<strong>`, `<ul>`, `<li>`, `<a>`, `<table>`, etc.). If the draft is in markdown, convert before publishing:
  ```bash
  npx marked < draft.md > /tmp/post-content.html
  ```
- For long posts, write HTML to a local file first, then use `content_file` to pipe it via stdin:
  ```
  wp(command='post create - --post_title="My Post" --post_status=draft --porcelain', content_file='/tmp/post-content.html')
  wp(command='post update <post-id> -', content_file='/tmp/post-content.html')
  ```
- The `-` in the command tells wp-cli to read content from stdin. **Never use local file paths directly** (e.g. `post create ./file.html`) — those paths don't exist on the remote WordPress server.
- Use `--porcelain` to get just the post ID for scripting.

## Post-Publish Checklist

After publishing a post:

1. **Assign language category**: `wp post term set <post-id> category english` (or `chinese`). Without this, the post will NOT appear on the homepage or blog listing page. This is the most common publishing mistake.
2. **Verify live**: Visit the post URL and confirm it renders correctly
3. **Check homepage**: Confirm the post appears in "Latest from the blog" on the homepage
4. **Share to social**: Use the `social-distribution` skill to draft social posts for Reddit, X, and HN
5. **Update internal links**: Check 2-3 related existing posts and add a link to the new post
6. **Update content calendar**: Mark the topic as published in the editorial calendar
