# Research & Topic Ideation

Use CLI tools to research topics, find trending discussions, and generate content ideas for openclaws.blog.

## Research Sources

### Hacker News
```bash
au news latest --provider hacker-news --limit 15          # Top stories
au news latest --provider hacker-news --limit 10          # Show HN for product launches
au news read --provider hacker-news --id <story-id>       # Read comments on a story
```

Look for: AI agent discussions, local-first tools, open-source launches, developer workflow topics.

### Reddit
Key subreddits for our audience:

| Subreddit | Focus | Use For |
|-----------|-------|---------|
| r/LocalLLaMA | Local AI models | Technical content ideas, model comparisons |
| r/selfhosted | Self-hosted software | Infrastructure, privacy-first angles |
| r/artificial | General AI | Trend pieces, industry analysis |
| r/ChatGPT | AI assistants | User pain points, feature comparisons |
| r/commandline | CLI tools | CLI agent content, developer workflows |
| r/opensource | Open-source projects | Community, contribution stories |

```bash
# Scan subreddits for trending topics
au reddit hot LocalLLaMA 10
au reddit hot selfhosted 10
au reddit hot artificial 10

# Search for specific topics
au reddit search "ai agent CLI" new all 10
au reddit search "open source ai assistant" top month 10

# Deep-dive into a discussion
au reddit read <post_url> 20 --depth 3
```

### Tech News
```bash
au news latest --providers techcrunch,wired --limit 10    # Tech news
au news latest --provider producthunt --limit 10          # New product launches
```

### YouTube
```bash
# Get transcripts from relevant tech videos for content inspiration
au youtube transcript "https://www.youtube.com/watch?v=VIDEO_ID"
```

## Topic Ideation Workflow

1. **Scan** -- Check HN, Reddit, and tech news for trending AI/developer topics
2. **Filter** -- Does this topic relate to AI agents, local AI, CLI tools, or developer workflows?
3. **Angle** -- How can we connect this to OpenClaw or Warden? Options:
   - Tutorial: "How to do X with OpenClaw"
   - Comparison: "OpenClaw vs [trending tool]"
   - Explainer: "What is [trending concept] and why it matters"
   - Opinion: "Why [trend] means [insight for developers]"
4. **Validate** -- Is anyone searching for this? Check Reddit/HN comment volume as a proxy for interest
5. **Add to calendar** -- Update `content/calendar.md` with the topic, target keywords, and angle

## Competitor Content Monitoring

Check what similar projects are blogging about:
```bash
# Fetch competitor blog/docs pages (if publicly accessible)
curl -s https://docs.cursor.com/changelog | head -100
curl -s https://aider.chat/HISTORY.html | head -100
```

## Output Format

When reporting research findings, use:

```
## Research Report - [Date]

### Trending Topics
1. [Topic] - Seen on [source] - [engagement level]
   - Angle: [how to write about it]
   - Keywords: [target keywords]

### Content Opportunities
- [ ] [Post title idea] - [category] - [priority: high/medium/low]

### Notable Discussions
- [Link/reference] - [why it matters]
```
