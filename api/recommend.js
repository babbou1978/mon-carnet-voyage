export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { prompt, structured, language } = req.body;
  if (!prompt) return res.status(400).json({ error: 'Prompt manquant' });

  const langInstructions = {
    fr: "Réponds en français.",
    en: "Respond in English.",
    es: "Responde en español.",
    de: "Antworte auf Deutsch.",
    it: "Rispondi in italiano.",
    pt: "Responda em português.",
    nl: "Antwoord in het Nederlands.",
    ja: "日本語で回答してください。",
    zh: "请用中文回答。",
    ar: "أجب باللغة العربية.",
  };
  const langInstruction = langInstructions[language] || langInstructions["en"];

  try {
    const systemPrompt = structured
      ? `You are Outsy AI, a personal travel agent. ${langInstruction}
Respond ONLY with valid JSON, no markdown, no backticks, no text before or after.
Required format:
{
  "recommendations": [
    {
      "idx": 3,
      "name": "place name as written in the candidate list",
      "cuisine": "specific cuisine or venue style or null",
      "price": "€€",
      "headline": "1 short sentence (max ~110 chars) that cites the anchor naturally — e.g. 'Comme Buenos Aires, parrilla argentine et vins natures' or 'Pour ton envie de rooftop, terrasse au 6e étage'. Never write a generic description.",
      "anchor": {
        "kind": "mood | favorite | friend | context | null",
        "ref": "the actual reference: a mood phrase, a favorite place name, a friend's name, or short context — null only when no honest link exists"
      },
      "signals": [
        { "kind": "mood | taste | friends", "label": "short reason ≤ 8 words" }
      ],
      "tip": "practical insider tip or null",
      "warning": "specific warning based on user's dislikes or null"
    }
  ]
}
Rules for the schema:
- Order the recommendations array by strength of match (best first). No numeric score.
- "anchor" is the primary justification. If the mood is set and you can honestly link the place to it, kind = "mood". If a favorite is a real match, kind = "favorite". A friend reference is "friend". Otherwise "context" (proximity, reputation) or null.
- Never invent a link. A korean spot is not a japanese favorite. If you cannot honestly tie the place to a favorite or a mood, leave anchor.kind = "context" or null and rely on signals.
- "signals" lists the matches actually used. Valid kinds: "mood", "taste", "friends". Only include "mood" if the place truly matches the mood, only include "taste" if it shares a real attribute with a top favorite, only include "friends" if a friend has been there. Max 3 signals. NEVER emit a "context" signal — leave it out when no specific signal applies.
- "headline" must reflect the anchor and be specific. No filler like "Great restaurant in town".`
      : `You are Outsy AI, a personal travel agent expert. ${langInstruction}`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 3000,
        system: systemPrompt,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = await response.json();
    const text = data.content?.map(b => b.text || '').join('') || '';

    if (structured) {
      try {
        const clean = text.replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(clean);
        return res.status(200).json({ recommendations: parsed.recommendations });
      } catch {
        return res.status(200).json({ error: 'Parse error', raw: text });
      }
    }

    res.status(200).json({ result: text });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
}
