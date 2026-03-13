---
trigger: When creating diagrams, images, or visual assets for blog posts
description: How to handle images and diagrams in blog posts without external image tools
---
# Images & Diagrams

This environment does NOT have ImageMagick, rsvg-convert, Puppeteer, sharp, or any SVG-to-PNG converter. Do NOT attempt to install or use them — they will fail.

## Rules

1. **Never convert SVG to PNG** — it will fail and block the entire workflow.
2. **Never let a missing image block publishing** — text content is more important than diagrams.
3. **Never install new system dependencies** for image processing.

## How to Add Diagrams

Use **inline SVG directly in the HTML**. WordPress renders inline SVGs fine. Example:

```html
<figure>
<svg width="600" height="300" viewBox="0 0 600 300" xmlns="http://www.w3.org/2000/svg">
  <rect width="600" height="300" fill="#f8f9fa"/>
  <rect x="50" y="100" width="120" height="60" rx="8" fill="#2563eb"/>
  <text x="110" y="135" text-anchor="middle" fill="#fff" font-size="14">Step 1</text>
  <line x1="170" y1="130" x2="230" y2="130" stroke="#333" stroke-width="2" marker-end="url(#arrow)"/>
  <rect x="230" y="100" width="120" height="60" rx="8" fill="#2563eb"/>
  <text x="290" y="135" text-anchor="middle" fill="#fff" font-size="14">Step 2</text>
</svg>
<figcaption>Figure: Description of the diagram.</figcaption>
</figure>
```

## If an Image Is Truly Required

Skip it and continue with the rest of the workflow. Add a placeholder comment in the HTML:

```html
<!-- TODO: Add diagram here -->
```

**Never pause or stop the workflow because of a missing image.**
