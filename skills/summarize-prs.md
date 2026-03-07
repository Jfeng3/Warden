# Summarize open PRs across repos

Review open pull requests and provide a concise summary.

## Steps

1. Run `gh pr list --state open --json title,url,author,createdAt,repository` across relevant repos
2. Group PRs by repository
3. For each PR, note:
   - Title and author
   - How long it's been open
   - Any review status
4. Present a clean summary sorted by repo, newest first
