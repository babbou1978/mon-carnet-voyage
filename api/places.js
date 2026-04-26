export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { action, input, placeId, lat, lng, radius, type } = req.body;
  const key = process.env.GOOGLE_PLACES_KEY;

  const FIELD_MASK_VERIFY = 'places.displayName,places.businessStatus,places.name,places.currentOpeningHours,places.regularOpeningHours,places.rating,places.types,places.priceLevel';
  const FIELD_MASK_DETAILS_FULL = 'displayName,formattedAddress,addressComponents,priceLevel,types,rating,location,currentOpeningHours,regularOpeningHours,businessStatus';

  const extractCuisine = (types) => {
    const cuisineTypes = ['italian','japanese','chinese','french','indian','thai','mexican',
      'american','greek','spanish','mediterranean','british','korean','vietnamese','turkish',
      'lebanese','moroccan','sushi','pizza','burger','steakhouse','seafood','vegetarian'];
    const t = (types||[]).find(t => cuisineTypes.some(c => t.toLowerCase().includes(c)));
    return t ? t.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase()) : null;
  };

  const enrichFromPlace = (place, nameToVerify) => {
    const foundName = place?.displayName?.text?.toLowerCase()||"";
    const searchedName = (nameToVerify||"").toLowerCase();
    const searchWords = searchedName.split(" ").filter(w=>w.length>2);
    const matchingWords = searchWords.filter(w=>foundName.includes(w));
    const nameMatches = !nameToVerify || matchingWords.length >= Math.min(2, searchWords.length) ||
      (matchingWords.length >= 1 && foundName.length > 5 &&
       searchedName.includes(foundName.split(" ")[0]) && foundName.split(" ")[0].length > 4);
    const isPermClosed = place && nameMatches && place.businessStatus === 'CLOSED_PERMANENTLY';
    const isTempClosed = place && nameMatches && place.businessStatus === 'CLOSED_TEMPORARILY';
    return {
      placeId: place?.name?.split('/')?.pop() || null,
      operational: !isPermClosed && !isTempClosed,
      businessStatus: isPermClosed ? 'CLOSED_PERMANENTLY' : isTempClosed ? 'CLOSED_TEMPORARILY' : 'OPERATIONAL',
      openNow: place?.currentOpeningHours?.openNow ?? place?.regularOpeningHours?.openNow ?? null,
      openingHours: place?.currentOpeningHours?.weekdayDescriptions || place?.regularOpeningHours?.weekdayDescriptions || null,
      googleRating: place?.rating || null,
      cuisine: extractCuisine(place?.types)
    };
  };

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
        headers: { 'X-Goog-Api-Key': key, 'X-Goog-FieldMask': 'displayName,formattedAddress,addressComponents,priceLevel,types,rating,location' },
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
      // Verify by placeId if available, otherwise by searchText
      const { places: placesToVerify } = req.body;
      const results = await Promise.all(placesToVerify.map(async (p) => {
        try {
          let place;
          if (p.googlePlaceId) {
            // Use placeId directly - much more reliable
            const r = await fetch(`https://places.googleapis.com/v1/places/${p.googlePlaceId}?languageCode=fr`, {
              headers: { 'X-Goog-Api-Key': key, 'X-Goog-FieldMask': FIELD_MASK_DETAILS_FULL },
            });
            place = await r.json();
            // Wrap in same structure as searchText response
            place = { ...place, name: `places/${p.googlePlaceId}` };
            return { name: p.name, ...enrichFromPlace(place, null) };
          } else {
            // Fallback to searchText
            const r = await fetch('https://places.googleapis.com/v1/places:searchText', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': key, 'X-Goog-FieldMask': FIELD_MASK_VERIFY },
              body: JSON.stringify({ textQuery: `${p.name} ${p.address||''}`, maxResultCount: 1 }),
            });
            const data = await r.json();
            place = data.places?.[0];
            return { name: p.name, ...enrichFromPlace(place, p.name) };
          }
        } catch { return { name: p.name, operational: true }; }
      }));
      return res.status(200).json({ results, debug: results.map(r=>({name:r.name,status:r.businessStatus})) });

    } else if (action === 'nearby') {
      const typeMap = { "Restaurant":"restaurant","Bar / Café":"cafe","Hôtel":"lodging","Destination":"tourist_attraction","Activité":"museum" };
      const r = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': key,
          'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.rating,places.priceLevel,places.types,places.location,places.businessStatus,places.currentOpeningHours.openNow,places.currentOpeningHours.weekdayDescriptions,places.regularOpeningHours.openNow,places.regularOpeningHours.weekdayDescriptions' },
        body: JSON.stringify({ includedTypes:[typeMap[type]||"restaurant"], maxResultCount:10, rankPreference:"POPULARITY",
          locationRestriction:{circle:{center:{latitude:lat,longitude:lng},radiusMeters:radius}}, languageCode:'fr' }),
      });
      return res.status(200).json(await r.json());
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}
