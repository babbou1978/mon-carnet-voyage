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
  "country": "country name in English for that city (use your general knowledge)" | null,
  "locationText": "FULL precise location string if the user gave more than just a city (street number + street + postal code / arrondissement + city). Null if they only gave a city or nothing." | null,
  "kidsFriendly": true | false | null,
  "priceRange": "€" | "€€" | "€€€" | null,
  "radiusKm": number_between_1_and_50 | null,
  "unclearTerms": ["phrases", "the", "user", "wrote", "that", "you", "could", "not", "map"] | []
}

Rules:
- Be conservative. Only fill a field when the request clearly implies it. Use null otherwise.
- Type: pick exactly one. "rooftop bar" -> Bar. "place to stay" -> Hôtel. "museum / hike / show" -> Activité. "trip / weekend somewhere" -> Destination.

moodKeywords (be generous but precise):
  1. Always include EXPLICIT vibe / style / setting / cuisine / audience words the user wrote,
     verbatim in their language. Examples: "rooftop", "terrasse", "japonais", "speakeasy",
     "romantique", "live music", "vue mer", "chic", "casher", "chill", "cosy", "festif".
  2. INFER and add the canonical Google Places feature when the user's wording clearly maps
     to one. The list below gives the well-known triggers — but DON'T be limited to these
     words. Use your general knowledge of synonyms, slang and equivalent expressions in the
     user's language:
       - "outdoor seating/terrace" — for "terrasse", "jardin", "balcon", "plein air", "vue".
       - "rooftop" — for "rooftop", "sur les toits", "terrasse panoramique", "toit-terrasse".
       - "groups" — for PLURAL multi-people mentions: "amis", "potes", "copains", "collègues",
         "bande", "team", "équipe", "EVG", "EVJF", "réunion de famille", "anniversaire entre amis",
         "after work", "un groupe de", "team building". DO NOT add for singular companions:
         "un client", "un ami", "ma femme", "un date", etc.
       - "kids friendly" — for children OR teens with family: "enfants", "kids", "ados",
         "adolescents", "teens", "teenagers", "famille avec enfants", "en famille", "loulous",
         "mômes", "petits", "gamins".
       - "live music" — for "concert", "musique live", "live band", "DJ resident".
       - "cocktails" — for "cocktails", "cocktail bar", "mixologie".
       - "wine bar" — for "bar à vin", "wine bar", "cave à vin".
       - "brunch" — for "brunch".
       - "reservable" — for "à réserver", "réservation possible", "sur réservation".
       - "dog friendly" — for "avec mon chien", "dog friendly".
       - "vegetarian" / "vegan" — when explicitly mentioned.
       - "romantic" — for "en amoureux", "date night", "romantique", "tête à tête", "en couple".
  3. Keep moodKeywords as short tags (1-3 words each). Always in the user's language for the
     explicit ones; canonical English for inferred Google features. Max 8 tags. Explicit first.

unclearTerms (NEW — supports "I didn't fully understand your request"):
  - Use ONLY for words / short phrases the user wrote that you noticed but COULD NOT confidently
    map to either a vibe descriptor (moodKeywords) or a structured field (type, kidsFriendly,
    etc.). Examples: "fais ton truc", "comme d'hab", "selon ton humeur", "n'importe quoi qui
    fasse plaisir", a brand name you've never heard of, an idiom that doesn't translate to a
    feature.
  - DO NOT include a word in unclearTerms if you ALSO included it (or a canonical equivalent)
    in moodKeywords — pick one or the other.
  - Generic temporal mentions ("ce soir", "demain", "samedi") aren't unclear — just ignore them.
  - Empty array when the full request was understood.

Other fields:
- useCurrentLocation: true if the user mentions "near me", "around here", "dans le quartier", "à proximité", "à côté", etc. False if they explicitly name a city / area / country. Null if not stated.
- city: the city name itself in the USER'S LANGUAGE (French user -> "Lisbonne", "Londres"; English user -> "Lisbon", "London"). Null if "near me" or unspecified.
- country: the country that city belongs to, in the USER'S LANGUAGE ("France", "Royaume-Uni", "Portugal", "États-Unis"). Use your general knowledge — the user usually omits it. Only set it when you ALSO set a city. Null otherwise. This disambiguates places like Springfield, Cambridge, Toledo etc.
- locationText: if the user gave a PRECISE location (street number, street name, postal code, arrondissement, neighbourhood), copy that full string here as the user wrote it. Examples:
    "près du 55, avenue Hoche 75008 Paris" -> locationText: "55 avenue Hoche, 75008 Paris", city: "Paris", country: "France"
    "around 1600 Pennsylvania Ave Washington" -> locationText: "1600 Pennsylvania Ave, Washington", city: "Washington", country: "United States"
    "dans le Marais à Paris" -> locationText: "Marais, Paris", city: "Paris", country: "France"
    "à Paris" -> locationText: null, city: "Paris", country: "France"
    "près de moi" -> locationText: null, city: null
  Always also fill city/country when you fill locationText. Null when the user only mentions a city or nothing.
- kidsFriendly: true if "avec mes enfants" / "en famille" / "kids" / "avec les ados" / "avec mes adolescents" / "teens" mentioned. Ados count as family-suitable. Null otherwise (don't default to false).
- priceRange: only if explicitly stated ("cheap"/"€", "mid"/"€€", "fancy"/"upscale"/"€€€"). Else null.
- radiusKm: only if explicitly stated ("dans les 5 km", "within 10 km"). Else null.

Examples:
  "outsy je cherche un restaurant en rooftop avec mes collègues à côté"
  -> {"type":"Restaurant","moodKeywords":["rooftop","groups"],"useCurrentLocation":true,"city":null,"country":null,"locationText":null,"kidsFriendly":null,"priceRange":null,"radiusKm":null}

  "un bar speakeasy romantique à Paris en amoureux" (user lang: fr)
  -> {"type":"Bar","moodKeywords":["speakeasy","romantique","romantic"],"useCurrentLocation":false,"city":"Paris","country":"France","locationText":null,"kidsFriendly":null,"priceRange":null,"radiusKm":null}

  "hôtel chic à Lisbonne avec piscine" (user lang: fr)
  -> {"type":"Hôtel","moodKeywords":["chic","piscine"],"useCurrentLocation":false,"city":"Lisbonne","country":"Portugal","locationText":null,"kidsFriendly":null,"priceRange":"€€€","radiusKm":null}

  "fancy hotel in Lisbon with a pool" (user lang: en)
  -> {"type":"Hôtel","moodKeywords":["chic","piscine"],"useCurrentLocation":false,"city":"Lisbon","country":"Portugal","locationText":null,"kidsFriendly":null,"priceRange":"€€€","radiusKm":null}

  "activité en famille au bord de la mer"
  -> {"type":"Activité","moodKeywords":["bord de mer","kids friendly"],"useCurrentLocation":null,"city":null,"country":null,"locationText":null,"kidsFriendly":true,"priceRange":null,"radiusKm":null}

  "café avec terrasse pour brunch entre amis dans le Marais à Paris"
  -> {"type":"Café","moodKeywords":["terrasse","brunch","groups"],"useCurrentLocation":false,"city":"Paris","country":"France","locationText":"Marais, Paris","kidsFriendly":null,"priceRange":null,"radiusKm":null}

  "Je cherche un restaurant avec terrasse ou rooftop près du 55, avenue Hoche 75008 Paris pour amener un client jeudi soir" (user lang: fr)
  -> {"type":"Restaurant","moodKeywords":["terrasse","rooftop"],"useCurrentLocation":false,"city":"Paris","country":"France","locationText":"55 avenue Hoche, 75008 Paris","kidsFriendly":null,"priceRange":null,"radiusKm":null}
  (NOTE: "un client" = singular, do NOT add "groups". Only one companion.)

  "restaurant avec ma femme pour notre anniversaire dans le 6e arrondissement à Paris"
  -> {"type":"Restaurant","moodKeywords":["romantic"],"useCurrentLocation":false,"city":"Paris","country":"France","locationText":"6e arrondissement, Paris","kidsFriendly":null,"priceRange":null,"radiusKm":null}
  (NOTE: "ma femme" = singular romantic context, NOT groups.)

  "je cherche un resto entre potes dans le quartier"
  -> {"type":"Restaurant","moodKeywords":["groups"],"useCurrentLocation":true,"city":null,"country":null,"locationText":null,"kidsFriendly":null,"priceRange":null,"radiusKm":null,"unclearTerms":[]}
  (NOTE: "entre potes" = plural buddies → groups. "dans le quartier" → useCurrentLocation.)

  "je cherche une activité avec des ados près de moi"
  -> {"type":"Activité","moodKeywords":["kids friendly","ados"],"useCurrentLocation":true,"city":null,"country":null,"locationText":null,"kidsFriendly":true,"priceRange":null,"radiusKm":null,"unclearTerms":[]}
  (NOTE: "ados" = teenagers → kidsFriendly:true (family-suitable) + keep "ados" as a mood
   keyword so the text search also pulls teen-targeted activities like escape rooms or VR.)

  "un truc cool sympa pour ce soir"
  -> {"type":null,"moodKeywords":["cool","sympa"],"useCurrentLocation":null,"city":null,"country":null,"locationText":null,"kidsFriendly":null,"priceRange":null,"radiusKm":null,"unclearTerms":[]}
  (NOTE: "cool" / "sympa" are vibe descriptors — keep them as moodKeywords, the text search
   can use them. "ce soir" is temporal and we can't act on it — just ignore. No type was
   specified, leave it null.)

  "outsy fais ton truc, surprends-moi"
  -> {"type":null,"moodKeywords":[],"useCurrentLocation":null,"city":null,"country":null,"locationText":null,"kidsFriendly":null,"priceRange":null,"radiusKm":null,"unclearTerms":["fais ton truc","surprends-moi"]}
  (NOTE: too vague — the user hasn't specified anything actionable. Surface in unclearTerms
   so the UI can ask for a reformulation.)`;

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
        ? parsed.moodKeywords.filter(k => typeof k === "string" && k.trim()).slice(0, 8).map(k => k.trim())
        : [],
      useCurrentLocation: typeof parsed.useCurrentLocation === "boolean" ? parsed.useCurrentLocation : null,
      city: typeof parsed.city === "string" && parsed.city.trim() ? parsed.city.trim() : null,
      country: typeof parsed.country === "string" && parsed.country.trim() ? parsed.country.trim() : null,
      locationText: typeof parsed.locationText === "string" && parsed.locationText.trim() ? parsed.locationText.trim() : null,
      kidsFriendly: typeof parsed.kidsFriendly === "boolean" ? parsed.kidsFriendly : null,
      priceRange: allowedPrices.includes(parsed.priceRange) ? parsed.priceRange : null,
      radiusKm: typeof parsed.radiusKm === "number" && parsed.radiusKm > 0 && parsed.radiusKm <= 100
        ? Math.round(parsed.radiusKm) : null,
      unclearTerms: Array.isArray(parsed.unclearTerms)
        ? parsed.unclearTerms.filter(k => typeof k === "string" && k.trim()).slice(0, 6).map(k => k.trim())
        : [],
    };

    // Log every parse to Vercel — input + output. Lets us inspect after the
    // fact (via `vercel logs`) which phrases the parser struggles with so we
    // can refine the prompt iteratively. No PII is logged beyond the raw
    // user text the parser received.
    console.log("parse-intent:", JSON.stringify({ text: text.trim(), lang: language, out }));

    return res.status(200).json(out);
  } catch (e) {
    return res.status(500).json({ error: 'server_error', message: String(e) });
  }
}
