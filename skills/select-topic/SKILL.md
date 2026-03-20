---
trigger: When selecting a blog topic for openclaws.blog
description: Topic pillars and selection criteria for openclaws.blog blog posts
---
# Topic Selection

Load the topic pillars from `docs/product-strategy/content_topics.md`. Every blog post must map to at least one pillar defined there. All topics must be framed as problems our target personas (defined in `docs/product-strategy/customer-segmentation.md`) would actually search for.

## Topic Notification Template

After selecting a topic, send a Telegram notification using this format:

```
🧭 <b>Topic Selected: [Topic title]</b>

―――――――――――――
📌 TOPIC SNAPSHOT
―――――――――――――
▸ <b>Pillar:</b> [Which pillar this maps to]
▸ <b>Sources (min 5):</b>
  1. <a href="[url]">[Source article title]</a>
  2. <a href="[url]">[Source article title]</a>
  3. <a href="[url]">[Source article title]</a>
  4. <a href="[url]">[Source article title]</a>
  5. <a href="[url]">[Source article title]</a>
▸ <b>Angle:</b> [One-line summary of the angle you will take]
```
