---
trigger: When using the au CLI for news, Reddit, weather, YouTube, PDFs, or file conversion
description: au CLI toolkit reference (news, Reddit, weather, YouTube, PDF, slides)
---
# Agent Utilities (au CLI)

`au` is a CLI toolkit installed at `/opt/homebrew/bin/au`. Use it via bash for news, weather, Reddit, YouTube, PDFs, file conversion, and slides.

## Updating the `au` CLI

The `au` CLI is built from the `agent-utils` project. If commands are missing or outdated, rebuild and reinstall:

```bash
cd /Users/jie/Codes/cue-agent-utils
npm run build && npm install -g .
au --help                         # Verify installation
```

## Discovering skill docs

Each command has a bundled skill with detailed usage:

```bash
au skill list           # List all skills
au skill read <name>    # Read full docs for a skill
au news --help          # Command-specific help
```

## News

Fetch headlines from Hacker News, BBC, CBS, ITHome, Product Hunt, TechCrunch, and WIRED.

```bash
au news providers                                    # List all providers with language metadata
au news latest                                       # Default bundle: wired, techcrunch, hacker-news, producthunt
au news latest --provider hacker-news --limit 10     # Single provider
au news latest --providers bbc,wired,techcrunch --limit 12  # Multiple providers
au news latest --providers bbc,wired --limit 10 --per-provider 5
au news read --provider hacker-news --id 123456      # Read a specific HN item
au news latest --provider ithome --limit 10          # Chinese tech news
```

- `--json` for machine-readable output
- HN story types: `top`, `new`, `best`, `ask`, `show`, `job`
- BBC/CBS sections: `top`, `world`, `business`, `technology`

## Reddit

Read-only Reddit access, no authentication required.

```bash
au reddit top <subreddit> [period] [limit]
au reddit hot <subreddit> [limit]
au reddit new <subreddit> [limit]
au reddit recent-comments <subreddit> [limit]
au reddit read <post_url_or_id> [limit] [--depth <n>]
au reddit search "query" [sort] [period] [limit]
au reddit search-sub <subreddit> "query" [sort]
au reddit user <username> [limit]
```

- `--json` for raw API payloads
- `--after <token>` for pagination

## Weather

No API key needed. Uses Open-Meteo.

```bash
au weather current "Seattle, WA"
au weather forecast "Seattle, WA" --days 5
au weather lookup "Springfield"                      # Disambiguate common names
au weather current --lat 47.6062 --lon -122.3321 --name Seattle --units us
```

- `--units auto` picks US/metric based on resolved location
- `--json` for machine-readable output

## YouTube

Fetch cleaned transcripts from YouTube videos.

```bash
au youtube setup                                     # Install yt-dlp (one-time)
au youtube doctor                                    # Verify dependencies
au youtube transcript "https://www.youtube.com/watch?v=VIDEO_ID"
au youtube transcript "https://www.youtube.com/watch?v=VIDEO_ID" --output transcript.txt
```

## PDF Operations

Inspect, extract, OCR, merge, split, render, and edit PDFs.

```bash
au pdf doctor                                        # Check dependencies
au pdf inspect file.pdf                              # Triage: page count, text layer, metadata
au pdf extract file.pdf --stdout                     # Extract text (born-digital PDFs)
au pdf ocr scan.pdf searchable.pdf                   # OCR scanned PDFs
au pdf render file.pdf --output-dir rendered/        # Page-by-page PNG for visual QA
au pdf split file.pdf excerpt.pdf --pages 10-12      # Extract pages
au pdf delete file.pdf trimmed.pdf --pages 10-12     # Remove pages
au pdf insert base.pdf extra.pdf combined.pdf --after 9
au pdf replace base.pdf cover.pdf updated.pdf --page 1
au pdf merge combined.pdf part-a.pdf part-b.pdf
au pdf create report.md report.pdf                   # Markdown to PDF (delegates to md-to-pdf)
```

Workflow: inspect first, then extract/ocr, render after changes for visual QA.

## File to Markdown

Convert local files to Markdown using MarkItDown.

```bash
au file-to-md setup                                  # Install MarkItDown (one-time)
au file-to-md doctor                                 # Verify tooling
au file-to-md input.pdf output.md
au file-to-md input.docx --stdout
au file-to-md recording.wav transcript.md            # Audio transcription
```

Supported: PDF, DOCX, TXT, JSON, CSV, XML, HTML, WAV, MP3.

## Markdown to PDF

```bash
au md-to-pdf input.md output.pdf
au md-to-pdf input.md output.html                    # HTML output
```

## Slides

Build and manage PowerPoint decks.

```bash
au md-to-slides deck.md slides.pptx                  # Markdown to slides
au slides build deck.json deck.pptx                   # JSON definition to PPTX
au slides render deck.pptx --output-dir rendered/     # Render slides to images
```
