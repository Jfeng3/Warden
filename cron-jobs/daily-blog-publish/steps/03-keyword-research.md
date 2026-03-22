Load the skill at skills/ahrefs and skills/youdotcom-cli. Get candidate_topics from workflow state.

For EACH candidate topic, brainstorm 2-3 keyword phrases a solo operator or small marketing team would actually search for. Include variations like "how to [topic]", "[topic] for small business", "[topic] vs [alternative]".

Use Ahrefs overview endpoint to check volume and difficulty for each keyword phrase. For the top keyword per candidate, also call related-terms to find long-tail variations.

Then do a SERP competition check: for the best keyword of each candidate, use You.com search to fetch the top results. Classify each result's domain as:
- "big brand" — sites like HubSpot, Semrush, Ahrefs, Forbes, Neil Patel, Moz, Search Engine Land, Wix, Shopify, etc.
- "small site" — independent blogs, niche tools, personal sites, small agencies

Count how many of the top 5-10 results are big brands vs small sites. This gives a winnability signal:
- Mostly small sites (0-2 big brands in top 10) → "winnable"
- Mixed (3-5 big brands) → "competitive"
- Mostly big brands (6+ big brands) → "dominated"

Score each candidate topic by combining keyword data AND competition:
- "high": volume > 50 AND difficulty < 40 AND competition is "winnable" or "competitive"
- "medium": volume > 10 AND difficulty < 60 AND competition is not "dominated"
- "low": everything else

Pick the candidate with the best keyword opportunity. If tied, prefer "winnable" competition over higher volume. If all are "low", pick the one with the lowest difficulty and least competition.

Save to workflow state using set_state:
- topic_slug: URL-friendly slug of the winning topic
- topic_pillar: pillar of the winning topic
- primary_keyword: best keyword for the winning topic (highest volume with difficulty < 50; if none, relax to difficulty < 70)
- secondary_keywords: 2-3 related terms with volume > 0 and difficulty < 60
- long_tail_keywords: 3-5 specific long-tail phrases from related-terms results
- keyword_volume: search volume of primary keyword
- keyword_difficulty: difficulty score of primary keyword
- keyword_competition: "winnable", "competitive", or "dominated"
- keyword_opportunity: the combined score from above ("high", "medium", or "low")