Load the skill at skills/ahrefs. Get candidate_topics from workflow state.

For EACH candidate topic, brainstorm 2-3 keyword phrases a solo operator or small marketing team would actually search for. Include variations like "how to [topic]", "[topic] for small business", "[topic] vs [alternative]".

Use Ahrefs overview endpoint to check volume and difficulty for each keyword phrase. For the top keyword per candidate, also call related-terms to find long-tail variations.

Score each candidate topic by its best keyword opportunity:
- "high": volume > 50 and difficulty < 40
- "medium": volume > 10 and difficulty < 60
- "low": volume <= 10 or difficulty >= 60

Pick the candidate with the best keyword opportunity. If tied, prefer higher volume. If all are "low", pick the one with the lowest difficulty.

Save to workflow state using set_state:
- topic_slug: URL-friendly slug of the winning topic
- topic_pillar: pillar of the winning topic
- primary_keyword: best keyword for the winning topic (highest volume with difficulty < 50; if none, relax to difficulty < 70)
- secondary_keywords: 2-3 related terms with volume > 0 and difficulty < 60
- long_tail_keywords: 3-5 specific long-tail phrases from related-terms results
- keyword_volume: search volume of primary keyword
- keyword_difficulty: difficulty score of primary keyword
- keyword_opportunity: the score from above ("high", "medium", or "low")