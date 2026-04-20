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
      "name": "Place name",
      "type": "place type",
      "price": "€€",
      "address": "full address with street number, street, city, country",
      "matchScore": 95,
      "matchReasons": ["Matches your love of X", "Similar to your favorite Y"],
      "why": "Personalized description 1-2 sentences. When natural and relevant, mention a similarity to one of their favorite places or preferences. Do not force it if not genuinely relevant.",
      "tip": "practical insider tip",
      "warning": "specific warning based on their dislikes or null"
    }
  ]
}`
      : `You are Outsy AI, a personal travel agent expert. ${langInstruction}`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-5',
        max_tokens: 4000,
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
