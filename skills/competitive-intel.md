# Competitive Intelligence

Monitor the AI agent/assistant landscape to inform content strategy and product positioning.

## Competitor Tracker

Key tools and projects to monitor:

| Project | Category | What to Watch |
|---------|----------|---------------|
| Goose (Block) | CLI agent | New features, blog posts, community growth |
| Aider | Coding agent | Release notes, supported models |
| Continue | IDE agent | VS Code marketplace stats, changelog |
| Cursor | AI IDE | Pricing changes, new capabilities |
| Claude Code | CLI agent | Feature releases, docs updates |
| Open Interpreter | CLI agent | Releases, community activity |

## GitHub Repo Monitoring

```bash
# Check repo stats (stars, forks, recent activity)
gh api repos/OWNER/REPO --jq '{stars: .stargazers_count, forks: .forks_count, open_issues: .open_issues_count, updated: .updated_at}'

# List recent releases
gh release list --repo OWNER/REPO --limit 5

# View latest release details
gh release view --repo OWNER/REPO

# Compare star growth (check periodically and track)
gh api repos/OWNER/REPO --jq '.stargazers_count'

# List recent commits (activity pulse)
gh api repos/OWNER/REPO/commits --jq '.[0:5] | .[] | {date: .commit.author.date, message: .commit.message}'
```

## Reddit & HN Monitoring

```bash
# Search Reddit for competitor mentions
au reddit search "OpenInterpreter OR Aider OR Goose AI agent" new all 10

# Check relevant subreddits for trending topics
au reddit hot LocalLLaMA 10
au reddit hot selfhosted 10

# Monitor HN for AI agent discussions
au news latest --provider hacker-news --limit 15
```

## Turning Intel into Content

When you find something notable:

1. **New competitor release** -> Write a comparison post ("X just launched Y -- here's how OpenClaw compares")
2. **Trending topic** -> Write an explainer that positions OpenClaw as a solution
3. **Community pain point** -> Write a tutorial addressing it with OpenClaw
4. **Market shift** -> Write a thought leadership piece on the trend

## Tracking Format

When reporting competitive intel, use this format:

```
## Competitive Update - [Date]

### Notable Changes
- [Project]: [What changed] - [Content opportunity]

### Trending Topics
- [Topic]: [Where trending] - [Angle for openclaws.blog]

### Action Items
- [ ] Write: [post idea]
- [ ] Monitor: [thing to keep watching]
```
