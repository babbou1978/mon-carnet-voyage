// Parse a natural-language search request into structured Outsy parameters.
//
// The frontend sends the full content of the user's "ask Outsy" textarea.
// Claude extracts what to fill in the Reco form: type, mood keywords, location
// preference, kids-friendly hint, price range, and search radius. The intent
// is conservative: fields the user didn't clearly imply stay null and the
// frontend keeps whatever was already in the form.

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { text, language } = req.body || {};
  if (!text || typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({ error: 'Empty text' });
  }

  const langInstructions = {
    fr: "L'utilisateur écrit probablement en français.",
    en: "The user writes probably in English.",
    es: "El usuario escribe probablemente en español.",
    de: "Der Benutzer schreibt wahrscheinlich auf Deutsch.",
    it: "L'utente scrive probabilmente in italiano.",
    pt: "O usuário escreve provavelmente em português.",
    nl: "De gebruiker schrijft waarschijnlijk in het Nederlands.",
  };
  const langHint = langInstructions[language] || langInstructions["en"];

  const systemPrompt = `You are an intent parser for Outsy AI, a place-recommendation app.
${langHint}
Your job: read the user's natural-language request and extract structured fields.

Output ONLY valid JSON, no markdown, no backticks, no explanation:
{
  "type": "Restaurant" | "Bar" | "Café" | "Hôtel" | "Activité" | "Destination" | null,
  "moodKeywords": ["short", "keywords", "describing", "vibe", "or", "constraints"] | [],
  "useCurrentLocation": true | false | null,
  "city": "name of city if explicitly mentioned" | null,
  "kidsFriendly": true | false | null,
  "priceRange": "€" | "€€" | "€€€" | null,
  "radiusKm": number_between_1_and_50 | null
}

Rules:
- Be conservative. Only fill a field when the request clearly implies it. Use null otherwise.
- Type: pick exactly one. "rooftop bar" -> Bar. "place to stay" -> Hôtel. "museum / hike / show" -> Activité. "trip / weekend somewhere" -> Destination.
- moodKeywords: 1-6 short tags describing setting / vibe / constraints. Examples: "rooftop", "japanese", "romantique", "terrasse", "live music", "kids menu", "vegetarian", "casher", "vue mer". Always in the user's language. NO full sentences.
- useCurrentLocation: true if the user mentions "near me", "around here", "dans le quartier", "à proximité", "à côté", etc. False if they explicitly name a city / area / country. Null if not stated.
- city: only the city name itself (e.g. "Paris", "London", "Lisbon"). Null if "near me" or unspecified.
- kidsFriendly: true if "avec mes enfants" / "en famille" / "kids" mentioned. Null otherwise (don't default to false).
- priceRange: only if explicitly stated ("cheap"/"€", "mid"/"€€", "fancy"/"upscale"/"€€€"). Else null.
- radiusKm: only if explicitly stated ("dans les 5 km", "within 10 km"). Else null.

Examples:
  "outsy je cherche un restaurant en rooftop avec mes collègues a côté"
  -> {"type":"Restaurant","moodKeywords":["rooftop","collègues","entre amis"],"useCurrentLocation":true,"city":null,"kidsFriendly":null,"priceRange":null,"radiusKm":null}

  "un bar speakeasy romantique à Paris"
  -> {"type":"Bar","moodKeywords":["speakeasy","romantique"],"useCurrentLocation":false,"city":"Paris","kidsFriendly":null,"priceRange":null,"radiusKm":null}

  "hotel chic à Lisbonne avec piscine"
  -> {"type":"Hôtel","moodKeywords":["chic","piscine"],"useCurrentLocation":false,"city":"Lisbonne","kidsFriendly":null,"priceRange":"€€€","radiusKm":null}

  "activité en famille au bord de la mer"
  -> {"type":"Activité","moodKeywords":["bord de mer","famille"],"useCurrentLocation":null,"city":null,"kidsFriendly":true,"priceRange":null,"radiusKm":null}`;

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 400,
        system: systemPrompt,
        messages: [{ role: 'user', content: text.trim() }],
      }),
    });
    const data = await r.json();
    const raw = data.content?.map(b => b.text || '').join('') || '';
    const clean = raw.replace(/```json|```/g, '').trim();

    let parsed;
    try { parsed = JSON.parse(clean); }
    catch { return res.status(200).json({ error: 'parse_error', raw }); }

    // Sanitize
    const allowedTypes = ["Restaurant","Bar","Café","Hôtel","Activité","Destination"];
    const allowedPrices = ["€","€€","€€€"];
    const out = {
      type: allowedTypes.includes(parsed.type) ? parsed.type : null,
      moodKeywords: Array.isArray(parsed.moodKeywords)
        ? parsed.moodKeywords.filter(k => typeof k === "string" && k.trim()).slice(0, 6).map(k => k.trim())
        : [],
      useCurrentLocation: typeof parsed.useCurrentLocation === "boolean" ? parsed.useCurrentLocation : null,
      city: typeof parsed.city === "string" && parsed.city.trim() ? parsed.city.trim() : null,
      kidsFriendly: typeof parsed.kidsFriendly === "boolean" ? parsed.kidsFriendly : null,
      priceRange: allowedPrices.includes(parsed.priceRange) ? parsed.priceRange : null,
      radiusKm: typeof parsed.radiusKm === "number" && parsed.radiusKm > 0 && parsed.radiusKm <= 100
        ? Math.round(parsed.radiusKm) : null,
    };

    return res.status(200).json(out);
  } catch (e) {
    return res.status(500).json({ error: 'server_error', message: String(e) });
  }
}
