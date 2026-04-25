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
      const r = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(input)}&key=${key}&language=fr`);
      const data = await r.json();
      if (data.results?.[0]) {
        const loc = data.results[0].geometry.location;
        return res.status(200).json({ lat: loc.lat, lng: loc.lng, address: data.results[0].formatted_address });
      }
      return res.status(200).json({ error: 'Not found' });

    } else if (action === 'verify') {
      const { places: placesToVerify } = req.body;
      const results = await Promise.all(placesToVerify.map(async (p) => {
        try {
          const r = await fetch('https://places.googleapis.com/v1/places:searchText', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Goog-Api-Key': key,
              'X-Goog-FieldMask': 'places.displayName,places.businessStatus,places.name,places.currentOpeningHours,places.regularOpeningHours,places.rating,places.types,places.priceLevel',
            },
            body: JSON.stringify({ textQuery: `${p.name} ${p.address||''}`, maxResultCount: 1 }),
          });
          const data = await r.json();
          const place = data.places?.[0];
          const foundName = place?.displayName?.text?.toLowerCase()||"";
          const searchedName = p.name.toLowerCase();
          const searchWords = searchedName.split(" ").filter(w=>w.length>2);
          const matchingWords = searchWords.filter(w=>foundName.includes(w));
          const nameMatches = matchingWords.length >= Math.min(2, searchWords.length) ||
                              (matchingWords.length >= 1 && foundName.length > 5 && 
                               searchedName.includes(foundName.split(" ")[0]) && foundName.split(" ")[0].length > 4);
          const isClosed = place && nameMatches && place.businessStatus === 'CLOSED_PERMANENTLY';

          // Extract cuisine from Google types
          const cuisineTypes = ['italian','japanese','chinese','french','indian','thai','mexican',
            'american','greek','spanish','mediterranean','british','korean','vietnamese','turkish',
            'lebanese','moroccan','sushi','pizza','burger','steakhouse','seafood','vegetarian'];
          const googleTypes = place?.types || [];
          const cuisineType = googleTypes.find(t => cuisineTypes.some(c => t.toLowerCase().includes(c)));
          const cuisine = cuisineType
            ? cuisineType.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase())
            : null;

          return {
            name: p.name,
            placeId: place?.name?.split('/')?.pop() || null,
            operational: !isClosed,
            businessStatus: isClosed ? 'CLOSED_PERMANENTLY' : 'OPERATIONAL',
            openNow: place?.currentOpeningHours?.openNow ?? place?.regularOpeningHours?.openNow ?? null,
            openingHours: place?.currentOpeningHours?.weekdayDescriptions || place?.regularOpeningHours?.weekdayDescriptions || null,
            googleRating: place?.rating || null,
            cuisine: cuisine
          };
        } catch { return { name: p.name, operational: true }; }
      }));
      return res.status(200).json({ results, debug: results.map(r=>({name:r.name,status:r.businessStatus})) });

    } else if (action === 'nearby') {
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
          'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.rating,places.priceLevel,places.types,places.location,places.businessStatus,places.currentOpeningHours.openNow,places.currentOpeningHours.weekdayDescriptions,places.regularOpeningHours.openNow,places.regularOpeningHours.weekdayDescriptions',
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
