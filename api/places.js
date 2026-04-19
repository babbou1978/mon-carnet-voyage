export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { action, input, placeId } = req.body;
  const key = process.env.GOOGLE_PLACES_KEY;

  try {
    if (action === 'autocomplete') {
      // Autocomplétion pendant la saisie
      const r = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': key,
        },
        body: JSON.stringify({
          input,
          languageCode: 'fr',
        }),
      });
      const data = await r.json();
      res.status(200).json(data);

    } else if (action === 'details') {
      // Détails complets d'un lieu sélectionné
      const r = await fetch(`https://places.googleapis.com/v1/places/${placeId}?languageCode=fr`, {
        headers: {
          'X-Goog-Api-Key': key,
          'X-Goog-FieldMask': 'displayName,formattedAddress,addressComponents,priceLevel,types,rating',
        },
      });
      const data = await r.json();
      res.status(200).json(data);
    }
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
}
