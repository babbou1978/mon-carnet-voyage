export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { prompt, structured } = req.body;
  if (!prompt) return res.status(400).json({ error: 'Prompt manquant' });

  try {
    const systemPrompt = structured
      ? `Tu es un agent de voyage personnel francophone. Tu réponds UNIQUEMENT en JSON valide, sans markdown, sans backticks, sans texte avant ou après.
Format attendu :
{
  "recommendations": [
    {
      "name": "Nom du lieu",
      "type": "type",
      "price": "€€",
      "address": "adresse complète",
      "why": "pourquoi ça correspond aux goûts",
      "tip": "conseil pratique",
      "warning": "point d'attention par rapport aux aversions (ou null)"
    }
  ]
}`
      : `Tu es un agent de voyage personnel francophone, expert en découvertes locales.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-5',
        max_tokens: 1500,
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
    res.status(500).json({ error: 'Erreur serveur' });
  }
}
