export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { action, input, placeId, lat, lng, type, lang } = req.body;
  const userLang = lang || 'en';
  const radius = parseFloat(req.body.radius);
  const latF = parseFloat(lat);
  const lngF = parseFloat(lng);
  const key = process.env.GOOGLE_PLACES_KEY;

  const FIELD_MASK_VERIFY = 'places.displayName,places.formattedAddress,places.businessStatus,places.name,places.currentOpeningHours,places.regularOpeningHours,places.rating,places.types,places.primaryType,places.primaryTypeDisplayName,places.priceLevel';
  const FIELD_MASK_DETAILS_FULL = 'displayName,formattedAddress,addressComponents,priceLevel,types,primaryType,rating,location,currentOpeningHours,regularOpeningHours,businessStatus';

  const extractCuisine = (types, primaryType, primaryTypeDisplayName) => {
    const cuisineTypes = [
      'italian','japanese','chinese','french','indian','thai','mexican',
      'american','greek','spanish','mediterranean','british','korean','vietnamese','turkish',
      'lebanese','moroccan','sushi','pizza','burger','steakhouse','seafood','vegetarian','vegan',
      'kosher','halal','israeli','kebab','ramen','pasta','tapas','barbecue','bbq','noodle',
      'asian_fusion','fast_food','sandwich','bakery','dessert','ice_cream','breakfast','brunch',
      'african','ethiopian','peruvian','brazilian','argentinian','german','portuguese','irish',
      'fusion','tex_mex','latin','caribbean','cajun','dim_sum','pho','curry','tacos'
    ];
    // Try primaryType first (most specific), then fall back to types array
    const allTypes = [primaryType, ...(types||[])].filter(Boolean);
    const found = allTypes.find(t => cuisineTypes.some(c => t.toLowerCase().includes(c)));
    if (found) {
      return found
        .replace(/_restaurant$/i, '')
        .replace(/_/g,' ')
        .replace(/\b\w/g, c => c.toUpperCase());
    }
    // Fallback: use Google's display name (localized) if it's not just "Restaurant"
    // e.g. "Restaurant casher", "Restaurant tunisien", "Italian restaurant"
    const display = primaryTypeDisplayName?.text || primaryTypeDisplayName;
    if (display && typeof display === 'string') {
      const lower = display.toLowerCase().trim();
      // Skip generic ones
      const generic = ['restaurant','bar','café','cafe','hotel','lodging','attraction','museum','food'];
      if (!generic.includes(lower)) {
        // Strip "Restaurant " prefix or " restaurant" suffix to get just the cuisine
        const cleaned = display
          .replace(/^restaurant\s+/i, '')
          .replace(/\s+restaurant$/i, '')
          .trim();
        return cleaned.replace(/\b\w/g, c => c.toUpperCase());
      }
    }
    return null;
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
      address: place?.formattedAddress || null,
      openNow: place?.currentOpeningHours?.openNow ?? place?.regularOpeningHours?.openNow ?? null,
      openingHours: place?.currentOpeningHours?.weekdayDescriptions || place?.regularOpeningHours?.weekdayDescriptions || null,
      googleRating: place?.rating || null,
      cuisine: extractCuisine(place?.types, place?.primaryType, place?.primaryTypeDisplayName)
    };
  };

  try {
    if (action === 'autocomplete') {
      const r = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': key },
        body: JSON.stringify({ input, languageCode: userLang }),
      });
      return res.status(200).json(await r.json());

    } else if (action === 'details') {
      const r = await fetch(`https://places.googleapis.com/v1/places/${placeId}?languageCode=${userLang}`, {
        headers: { 'X-Goog-Api-Key': key, 'X-Goog-FieldMask': 'displayName,formattedAddress,addressComponents,priceLevel,types,primaryType,primaryTypeDisplayName,rating,location' },
      });
      return res.status(200).json(await r.json());

    } else if (action === 'geocode') {
      const r = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(input)}&key=${key}&language=${userLang}`);
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
            const r = await fetch(`https://places.googleapis.com/v1/places/${p.googlePlaceId}?languageCode=${userLang}`, {
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
      // Multi-type for better coverage in dense areas (Marylebone has many sub-types)
      const typeGroups = {
        "Restaurant": ["restaurant", "seafood_restaurant", "italian_restaurant", "japanese_restaurant", "french_restaurant"],
        "Bar": ["bar", "night_club", "wine_bar", "cocktail_bar"],
        "Café": ["cafe", "coffee_shop", "bakery", "tea_house"],
        "Hôtel": ["lodging"],
        "Activité": [
          // Classic
          "museum", "art_gallery", "amusement_park", "performing_arts_theater", "zoo", "aquarium",
          // Entertainment
          "bowling_alley", "casino", "movie_theater", "karaoke", "video_arcade", "comedy_club",
          // Sports & leisure
          "gym", "spa", "fitness_center", "climbing_gym", "ice_skating_rink", "ski_resort",
          "stadium", "sports_complex", "golf_course", "miniature_golf_course",
          // Outdoor
          "amusement_park", "theme_park", "water_park", "trampoline_park", "campground",
          // Urban experiences
          "escape_room", "tourist_attraction", "shopping_mall", "event_venue",
          "laser_tag_center", "paintball_center", "archery_range"
        ],
        "Destination": ["tourist_attraction", "national_park", "historical_landmark"]
      };
      const types = typeGroups[type] || ["restaurant"];
      const fieldMask = 'places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.priceLevel,places.types,places.primaryType,places.primaryTypeDisplayName,places.location,places.businessStatus,places.currentOpeningHours.openNow,places.currentOpeningHours.weekdayDescriptions,places.regularOpeningHours.openNow,places.regularOpeningHours.weekdayDescriptions,places.editorialSummary,places.reviews';

      // Use includedTypes (broader) - matches both primary and secondary types.
      // We'll filter out unwanted primary types (e.g. lodging when searching restaurants) below.
      const requests = types.map(t => fetch('https://places.googleapis.com/v1/places:searchNearby', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': key, 'X-Goog-FieldMask': fieldMask },
        body: JSON.stringify({
          includedTypes: [t],
          maxResultCount: 20,
          rankPreference: "POPULARITY",
          locationRestriction: { circle: { center: { latitude: latF, longitude: lngF }, radius: radius } },
          languageCode: userLang
        }),
      }).then(r => r.json()).catch(() => ({places:[]})));

      const responses = await Promise.all(requests);

      // Filter out primary types that don't fit the requested category
      // (e.g. when searching Restaurants, exclude hotels themselves)
      // No primaryType exclusions needed - multi-type support handles overlap
      // (e.g. a hotel with a restaurant will be typed "Hôtel,Restaurant")

      // Dedup by displayName, add cuisine extraction
      const seen = new Map();
      responses.forEach(resp => {
        (resp.places||[]).forEach(p => {
          const key = (p.displayName?.text || p.id || p.name || "").toLowerCase().trim();
          if (key && !seen.has(key)) {
            p.cuisine = extractCuisine(p.types, p.primaryType, p.primaryTypeDisplayName);
            seen.set(key, p);
          }
        });
      });
      const allPlaces = Array.from(seen.values());

      // Sort by quality: rating prioritized, reviews capped at 1000 to avoid favoring tourist hotspots
      allPlaces.sort((a, b) => {
        const sa = (a.rating||0) * Math.sqrt(Math.min(a.userRatingCount||0, 1000));
        const sb = (b.rating||0) * Math.sqrt(Math.min(b.userRatingCount||0, 1000));
        return sb - sa;
      });

      console.log('Nearby request:', JSON.stringify({ lat: latF, lng: lngF, radius, types }));
      console.log('Nearby merged:', JSON.stringify({ totalUnique: allPlaces.length, perType: responses.map((r,i)=>({type:types[i], count:r.places?.length||0})), top5: allPlaces.slice(0,5).map(p=>p.displayName?.text) }));

      return res.status(200).json({ places: allPlaces });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}
