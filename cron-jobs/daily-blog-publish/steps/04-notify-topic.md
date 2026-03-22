Send a Telegram notification about the selected topic using send.sh.

IMPORTANT: Telegram only supports these HTML tags: <b>, <i>, <a href="">, <code>, <pre>. Do NOT use <ul>, <li>, <table>, <tr>, <td>, <h1>, <h2>, <br>, <p>, <div>, <span>, or any other tags. Use bullet characters (▸, •) for lists and line breaks for spacing. Escape & as &amp; and < as &lt; in text content.

The notification MUST include:

1. CANDIDATES EVALUATED — list all 4 candidate topics from candidate_topics (workflow state), showing each topic's title, pillar, and its best keyword volume/difficulty
2. SELECTED TOPIC — the winning topic with a brief explanation of why it was chosen over the other two (e.g. higher volume, lower difficulty, better keyword opportunity)
3. KEYWORD DATA — primary_keyword, keyword_volume, keyword_difficulty, keyword_opportunity, secondary_keywords, and long_tail_keywords from workflow state

Use this exact format:

cat > /tmp/tg-msg.html <<'MSG'
🧭 <b>Topic Selected: [winning topic title]</b>

―――――――――――――
📊 CANDIDATES EVALUATED
―――――――――――――

▸ <b>[Topic 1 title]</b>
  Pillar: [pillar] | Vol: [volume] | KD: [difficulty]

▸ <b>[Topic 2 title]</b>
  Pillar: [pillar] | Vol: [volume] | KD: [difficulty]

▸ <b>[Topic 3 title]</b>
  Pillar: [pillar] | Vol: [volume] | KD: [difficulty]

▸ <b>[Topic 4 title]</b>
  Pillar: [pillar] | Vol: [volume] | KD: [difficulty]

<b>Why this one:</b> [1-2 sentences on why the winner was chosen]

―――――――――――――
🔑 KEYWORD DATA
―――――――――――――

▸ <b>Primary:</b> [primary_keyword] (vol: [keyword_volume], KD: [keyword_difficulty])
▸ <b>Competition:</b> [keyword_competition]
▸ <b>Opportunity:</b> [keyword_opportunity]
▸ <b>Secondary:</b> [comma-separated secondary_keywords]
▸ <b>Long-tail:</b> [comma-separated long_tail_keywords]

―――――――――――――
📌 TOPIC SNAPSHOT
―――――――――――――

▸ <b>Pillar:</b> [topic_pillar]
▸ <b>Angle:</b> [One-line summary of the angle]
MSG
bash skills/notification/send.sh 7823756809 < /tmp/tg-msg.html