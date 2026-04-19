export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { action, input, placeId, lat, lng, radius, type } = req.body;
  const key = process.env.GOOGLE_PLACES_KEY;

  try {
    if (action === 'autocomplete') {
      const r = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': key },
        body: JSON.stringify({ input, languageCode: 'fr' }),
      });
      return res.status(200).json(await r.json());

    } else if (action === 'details') {
      const r = await fetch(`https://places.googleapis.com/v1/places/${placeId}?languageCode=fr`, {
        headers: {
          'X-Goog-Api-Key': key,
          'X-Goog-FieldMask': 'displayName,formattedAddress,addressComponents,priceLevel,types,rating,location',
        },
      });
      return res.status(200).json(await r.json());

    } else if (action === 'geocode') {
      // Convertir une adresse en coordonnées GPS
      const r = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(input)}&key=${key}&language=fr`);
      const data = await r.json();
      if (data.results?.[0]) {
        const loc = data.results[0].geometry.location;
        return res.status(200).json({ lat: loc.lat, lng: loc.lng, address: data.results[0].formatted_address });
      }
      return res.status(200).json({ error: 'Not found' });

    } else if (action === 'nearby') {
      // Chercher des lieux populaires à proximité
      const typeMap = {
        "Restaurant": "restaurant", "Bar / Café": "cafe", "Hôtel": "lodging",
        "Destination": "tourist_attraction", "Activité": "museum"
      };
      const googleType = typeMap[type] || "restaurant";
      const r = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': key,
          'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.rating,places.priceLevel,places.types,places.location',
        },
        body: JSON.stringify({
          includedTypes: [googleType],
          maxResultCount: 10,
          rankPreference: "POPULARITY",
          locationRestriction: {
            circle: { center: { latitude: lat, longitude: lng }, radiusMeters: radius }
          },
          languageCode: 'fr',
        }),
      });
      return res.status(200).json(await r.json());
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}
