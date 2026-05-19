// Weekly digest of unclear parse-intent terms.
//
// Called by the GitHub Action `.github/workflows/weekly-digest.yml` each
// Monday morning. Reads the last 7 days of parse_unclear_logs, aggregates
// unique terms with counts, sends them to Claude with a meta-prompt that
// asks for concrete prompt-improvement suggestions, and returns the result
// as JSON. The Action then creates a GitHub issue with the formatted
// digest so the user can validate the additions in one click.
//
// Auth: Bearer token from env WEEKLY_DIGEST_SECRET. Same secret must be
// set in the GitHub repo as a secret named WEEKLY_DIGEST_SECRET.

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const auth = req.headers.authorization || '';
  const expected = process.env.WEEKLY_DIGEST_SECRET
    ? `Bearer ${process.env.WEEKLY_DIGEST_SECRET}`
    : null;
  if (!expected || auth !== expected) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return res.status(500).json({ error: 'Supabase env missing' });
  }
  if (!process.env.ANTHROPIC_KEY) {
    return res.status(500).json({ error: 'ANTHROPIC_KEY missing' });
  }

  // Pull last 7 days of unclear cases (cap at 500 rows).
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const query = new URLSearchParams({
    'select': '*',
    'ts': `gte.${since}`,
    'order': 'ts.desc',
    'limit': '500',
  });
  const logsRes = await fetch(`${supabaseUrl}/rest/v1/parse_unclear_logs?${query}`, {
    headers: {
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`,
    },
  });
  if (!logsRes.ok) {
    const errText = await logsRes.text();
    return res.status(500).json({ error: 'supabase_query_failed', details: errText });
  }
  const logs = await logsRes.json();
  if (!Array.isArray(logs) || logs.length === 0) {
    return res.status(200).json({ empty: true, count: 0, uniqueTerms: 0 });
  }

  // Aggregate unique terms with counts + one example query per term.
  const termCounts = new Map();
  const examples = new Map();
  const langs = new Map();
  for (const log of logs) {
    for (const term of (log.unclear_terms || [])) {
      const norm = String(term).toLowerCase().trim();
      if (!norm) continue;
      termCounts.set(norm, (termCounts.get(norm) || 0) + 1);
      if (!examples.has(norm)) examples.set(norm, log.text);
      if (!langs.has(norm)) langs.set(norm, log.lang || 'unknown');
    }
  }
  const ranked = [...termCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 50)
    .map(([term, count]) => ({
      term,
      count,
      example: examples.get(term),
      lang: langs.get(term),
    }));

  // Meta-prompt: ask Claude to propose concrete prompt additions.
  const metaPrompt = `You're refining the system prompt of Outsy AI's natural-language search parser.

The parser reads short user queries like "je cherche un resto rooftop avec mes potes près de moi" and extracts structured fields (type, mood keywords, kidsFriendly flag, location intent, etc.). When it sees a word or short phrase it can't confidently classify, it returns it in an "unclearTerms" array.

Below is the list of unclearTerms collected over the last 7 days, ranked by frequency. Your job: for each term, decide whether the parser should learn it.

Known mood / feature concepts in the prompt today:
- groups (multiple people: amis, collègues, équipe, etc.)
- kids friendly (children or teens with family)
- outdoor seating / terrace / rooftop
- live music / cocktails / wine bar / brunch
- reservable / dog friendly / vegetarian / vegan / romantic
- raw vibe keywords (chill, festif, cosy, etc.) that get sent to text search verbatim

For each unclear term, output ONE of three classifications:
1. "actionable" — there is a clear meaning and we should learn it.
2. "skip" — too vague or idiomatic to act on (e.g. "fais ton truc", "comme d'habitude").

Output ONLY valid JSON (no markdown):
{
  "suggestions": [
    {
      "term": "loulous",
      "count": 5,
      "example": "activité pour les loulous",
      "meaning": "French informal term for 'kids / children'",
      "maps_to": "kids friendly",
      "prompt_addition": "Add 'loulous' alongside 'enfants', 'kids', 'ados', 'mômes' in the kids-friendly trigger list."
    }
  ],
  "skipped": [
    { "term": "fais ton truc", "reason": "Too vague — user hasn't specified anything actionable." }
  ]
}

Rules:
- maps_to should be one of: groups, kids friendly, outdoor seating, rooftop, live music, cocktails, wine bar, brunch, reservable, dog friendly, vegetarian, vegan, romantic, OR a free vibe keyword you'd let through to text search.
- prompt_addition must be specific: tell the engineer exactly what line/rule of the system prompt to extend.
- Be conservative on "skip" — if a term has any actionable meaning, prefer "actionable".

UNCLEAR TERMS (ranked by frequency):
${JSON.stringify(ranked, null, 2)}`;

  let suggestions = { suggestions: [], skipped: [] };
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        // Sonnet is overkill cost-wise for parsing but this runs once a
        // week and the analysis benefits from the stronger model.
        model: 'claude-sonnet-4-6',
        max_tokens: 4000,
        system: 'You are a careful prompt engineer. Output only valid JSON, no markdown.',
        messages: [{ role: 'user', content: metaPrompt }],
      }),
    });
    const data = await r.json();
    const raw = data.content?.map(b => b.text || '').join('') || '';
    const clean = raw.replace(/```json|```/g, '').trim();
    try { suggestions = JSON.parse(clean); }
    catch { suggestions = { error: 'claude_parse_error', raw }; }
  } catch (e) {
    suggestions = { error: 'claude_request_failed', message: String(e) };
  }

  return res.status(200).json({
    empty: false,
    count: logs.length,
    uniqueTerms: ranked.length,
    rangeStart: since,
    ranked,
    ...suggestions,
  });
}
