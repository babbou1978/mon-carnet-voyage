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
      // Optional cityOnly mode: restrict to geographic regions (locality,
      // admin areas, country). Max 5 types per Places API spec. Kept small
      // and Table-B-only so the API doesn't 400.
      const body = { input, languageCode: userLang };
      if (req.body.cityOnly) {
        body.includedPrimaryTypes = [
          'locality',
          'administrative_area_level_1',
          'administrative_area_level_2',
          'country',
        ];
      }
      const r = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': key },
        body: JSON.stringify(body),
      });
      return res.status(200).json(await r.json());

    } else if (action === 'details') {
      const detailsFieldMask = 'displayName,formattedAddress,addressComponents,priceLevel,types,primaryType,primaryTypeDisplayName,rating,userRatingCount,location,currentOpeningHours,regularOpeningHours,businessStatus,editorialSummary,reviews,websiteUri,internationalPhoneNumber,nationalPhoneNumber,googleMapsUri,photos,outdoorSeating,liveMusic,servesCocktails,goodForChildren,goodForGroups,servesVegetarianFood,allowsDogs,menuForChildren,reservable,servesBrunch,servesLunch,servesDinner,dineIn,takeout,delivery';
      const r = await fetch(`https://places.googleapis.com/v1/places/${placeId}?languageCode=${userLang}`, {
        headers: { 'X-Goog-Api-Key': key, 'X-Goog-FieldMask': detailsFieldMask },
      });
      const data = await r.json();
      // Convert photo references to URLs
      if (data.photos) {
        data.photoUrls = data.photos.slice(0, 8).map(p => 
          `https://places.googleapis.com/v1/${p.name}/media?maxWidthPx=600&key=${key}`
        );
      }
      return res.status(200).json(data);

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
      const mood = req.body.mood || "";
      // Multi-type for better coverage in dense areas (Marylebone has many sub-types)
      const typeGroups = {
        "Restaurant": ["restaurant", "seafood_restaurant", "italian_restaurant", "japanese_restaurant", "french_restaurant"],
        "Bar": ["bar", "night_club", "wine_bar", "cocktail_bar"],
        "Café": ["cafe", "coffee_shop", "bakery", "tea_house"],
        "Hôtel": ["lodging"],
        "Activité": [
          // Cultural
          "museum", "art_gallery", "botanical_garden",
          // Entertainment & games
          "amusement_park", "performing_arts_theater", "movie_theater",
          "bowling_alley", "miniature_golf_course", "video_arcade",
          // Shows & music
          "concert_hall", "comedy_club", "live_music_venue",
          // Animals
          "zoo", "aquarium",
          // Outdoor & parks
          "park", "playground", "theme_park", "water_park", 
          "trampoline_park", "ski_resort", "hiking_area",
          // Sports & leisure
          "ice_skating_rink", "golf_course", "swimming_pool",
          "marina", "dog_park", "skateboard_park",
          // Nightlife entertainment
          "casino", "karaoke"
        ],
        "Destination": ["tourist_attraction", "national_park", "historical_landmark"]
      };
      const types = typeGroups[type] || ["restaurant"];

      // Blacklist: primaryTypes that should never appear in Activité results
      // (Google sometimes returns unrelated nearby businesses)
      const ACTIVITY_BLACKLIST = new Set([
        "restaurant","bar","cafe","coffee_shop","bakery",
        "lodging","hotel","motel","hostel",
        "hair_salon","beauty_salon","massage","nail_salon",
        "gym","fitness_center","sports_complex","stadium",
        "travel_agency","real_estate_agency","insurance_agency",
        "school","university","preschool","primary_school","secondary_school",
        "dentist","doctor","pharmacy","hospital","physiotherapist",
        "car_repair","car_dealer","car_wash","gas_station",
        "clothing_store","grocery_store","supermarket","convenience_store",
        "bank","atm","post_office","laundry","dry_cleaning",
        "accounting","lawyer","locksmith","plumber","electrician",
        "church","mosque","synagogue","hindu_temple",
        "parking","transit_station","bus_station","train_station",
        "moving_company","storage","funeral_home","cemetery"
      ]);
      // FieldMask — expanded with every useful attribute Places API New exposes.
      // Same Preferred-tier SKU as before (already had editorialSummary + reviews)
      // so this costs the same per call but gives us much more structured signal.
      const fieldMask = [
        // Identity & location
        'places.id', 'places.displayName', 'places.formattedAddress', 'places.location',
        'places.types', 'places.primaryType', 'places.primaryTypeDisplayName',
        'places.addressDescriptor',
        // Reputation & price
        'places.rating', 'places.userRatingCount', 'places.priceLevel', 'places.businessStatus',
        // Hours
        'places.currentOpeningHours.openNow', 'places.currentOpeningHours.weekdayDescriptions',
        'places.regularOpeningHours.openNow', 'places.regularOpeningHours.weekdayDescriptions',
        // Long-form text (used by the mood matcher and the AI scorer)
        'places.editorialSummary', 'places.reviews',
        // Food & drink attributes
        'places.outdoorSeating', 'places.liveMusic', 'places.servesCocktails',
        'places.servesBeer', 'places.servesWine', 'places.servesCoffee', 'places.servesDessert',
        'places.servesBrunch', 'places.servesBreakfast', 'places.servesLunch', 'places.servesDinner',
        'places.servesVegetarianFood',
        // Audience / accessibility
        'places.goodForChildren', 'places.goodForGroups', 'places.goodForWatchingSports',
        'places.menuForChildren', 'places.allowsDogs',
        'places.reservable', 'places.restroom',
        // Service modes
        'places.dineIn', 'places.takeout', 'places.delivery', 'places.curbsidePickup',
        // Practical / amenities
        'places.parkingOptions', 'places.paymentOptions', 'places.accessibilityOptions',
      ].join(',');

      // Use includedTypes (broader) - matches both primary and secondary types.
      // Double strategy: POPULARITY for best-rated + DISTANCE for nearby gems
      const requests = [];
      types.forEach((t, idx) => {
        // POPULARITY pass for all types
        requests.push(fetch('https://places.googleapis.com/v1/places:searchNearby', {
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
        // DISTANCE pass for primary type only (to catch nearby gems missed by POPULARITY)
        if (idx === 0) {
          requests.push(fetch('https://places.googleapis.com/v1/places:searchNearby', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': key, 'X-Goog-FieldMask': fieldMask },
            body: JSON.stringify({
              includedTypes: [t],
              maxResultCount: 10,
              rankPreference: "DISTANCE",
              locationRestriction: { circle: { center: { latitude: latF, longitude: lngF }, radius: radius } },
              languageCode: userLang
            }),
          }).then(r => r.json()).catch(() => ({places:[]})));
        }
      });

      const responses = await Promise.all(requests);

      // If mood is specified, run Text Search variants in parallel to find
      // mood-specific places that Nearby's strict primary-type filter misses
      // (rooftop bars classed as 'bar' when user asks for restaurant, etc.)
      if (mood.trim()) {
        const textSearchFieldMask = fieldMask;
        const typeSuffix = type === "Restaurant" ? "restaurant"
          : type === "Bar" ? "bar"
          : type === "Café" ? "cafe"
          : type === "Hôtel" ? "hotel"
          : "";
        // Clean the full mood string: commas become spaces so Google reads it
        // as space-separated keywords, not a list.
        const cleanedMood = mood.replace(/[,;]/g, ' ').replace(/\s+/g, ' ').trim();
        // First keyword only (the most specific intent — 'rooftop' beats
        // generic synonyms like 'outdoor seating' that the parser may add).
        const primaryKeyword = mood.split(/[,;]/)[0].trim();

        const queries = [
          `${cleanedMood} ${typeSuffix}`.trim(),                  // full mood + type
          primaryKeyword !== cleanedMood ? `${primaryKeyword} ${typeSuffix}`.trim() : null, // just the headline keyword + type
          `${primaryKeyword} near here`.trim(),                   // headline keyword without type bias (catches 'rooftop' bars that serve food)
        ].filter(Boolean);

        const textSearches = await Promise.all(queries.map(q =>
          fetch('https://places.googleapis.com/v1/places:searchText', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': key, 'X-Goog-FieldMask': textSearchFieldMask },
            body: JSON.stringify({
              textQuery: q,
              maxResultCount: 15,
              locationRestriction: { circle: { center: { latitude: latF, longitude: lngF }, radius: radius } },
              languageCode: userLang
            }),
          }).then(r => r.json()).catch(() => ({places:[]}))
        ));

        try {
          textSearches.forEach((textData, i) => {
            if (textData.places && textData.places.length > 0) {
              // Tag every text-search hit so the downstream cross-type filter
              // doesn't drop e.g. rooftop BARS when the user wants a Restaurant.
              textData.places.forEach(p => { p._fromTextSearch = true; p._textQuery = queries[i]; });
              responses.push(textData);
            }
            console.log('Mood text search:', JSON.stringify({ q: queries[i], results: textData.places?.length || 0 }));
          });
        } catch (e) { console.error('Mood text search error:', e); }
      }

      // Dedup by displayName, add cuisine extraction
      const seen = new Map();
      responses.forEach(resp => {
        (resp.places||[]).forEach(p => {
          // Skip closed places
          if (p.businessStatus === 'CLOSED_PERMANENTLY' || p.businessStatus === 'CLOSED_TEMPORARILY') return;
          // For Activité: filter out places whose primaryType is in the blacklist
          if (type === "Activité" && ACTIVITY_BLACKLIST && p.primaryType && ACTIVITY_BLACKLIST.has(p.primaryType)) return;
          // Cross-type filtering: exclude restaurants from Bar results and vice versa
          // BUT skip this filter for results coming from the mood-driven Text
          // Search — those are keyword-matched (e.g. 'rooftop restaurant') and
          // a rooftop bar that serves food is a legitimate hit even though
          // Google buckets it as primaryType: bar.
          if (!p._fromTextSearch) {
            if (type === "Bar" && p.primaryType && (p.primaryType === "restaurant" || p.primaryType.includes("_restaurant"))) return;
            if (type === "Restaurant" && p.primaryType && (p.primaryType === "bar" || p.primaryType === "night_club")) return;
            if (type === "Café" && p.primaryType && (p.primaryType === "restaurant" || p.primaryType === "bar")) return;
          }
          const key = (p.displayName?.text || p.id || p.name || "").toLowerCase().trim();
          if (key && !seen.has(key)) {
            p.cuisine = extractCuisine(p.types, p.primaryType, p.primaryTypeDisplayName);
            // Build features summary from Google attributes
            const feats = [];
            // Setting / vibe
            if (p.outdoorSeating) feats.push("outdoor seating/terrace");
            if (p.liveMusic) feats.push("live music");
            // Food & drink
            if (p.servesCocktails) feats.push("cocktails");
            if (p.servesBeer) feats.push("beer");
            if (p.servesWine) feats.push("wine");
            if (p.servesCoffee) feats.push("coffee");
            if (p.servesDessert) feats.push("dessert");
            if (p.servesBrunch) feats.push("brunch");
            if (p.servesBreakfast) feats.push("breakfast");
            if (p.servesLunch) feats.push("lunch");
            if (p.servesDinner) feats.push("dinner");
            if (p.servesVegetarianFood) feats.push("vegetarian options");
            // Audience
            if (p.goodForChildren) feats.push("kids friendly");
            if (p.menuForChildren) feats.push("kids menu");
            if (p.goodForGroups) feats.push("good for groups");
            if (p.goodForWatchingSports) feats.push("sports viewing");
            if (p.allowsDogs) feats.push("dog friendly");
            // Service
            if (p.reservable) feats.push("reservable");
            if (p.restroom) feats.push("restroom");
            if (p.dineIn) feats.push("dine-in");
            if (p.takeout) feats.push("takeout");
            if (p.delivery) feats.push("delivery");
            if (p.curbsidePickup) feats.push("curbside pickup");
            // Parking
            if (p.parkingOptions?.freeParkingLot || p.parkingOptions?.freeStreetParking) feats.push("free parking");
            if (p.parkingOptions?.paidParkingLot) feats.push("paid parking");
            if (p.parkingOptions?.valetParking) feats.push("valet parking");
            // Accessibility
            if (p.accessibilityOptions?.wheelchairAccessibleEntrance) feats.push("wheelchair accessible");
            // Payment
            if (p.paymentOptions?.acceptsCreditCards) feats.push("credit cards");
            if (p.paymentOptions?.acceptsCashOnly) feats.push("cash only");
            if (p.paymentOptions?.acceptsNfc) feats.push("contactless payment");
            p.features = feats;
            // Also scan reviews/editorial for keywords that Places API doesn't
            // expose as booleans (rooftop, pool, view, garden, etc.)
            const allText = [
              p.editorialSummary?.text || p.editorialSummary,
              ...(p.reviews||[]).map(r => r.text?.text || "")
            ].filter(Boolean).join(" ").toLowerCase();
            const textFeatures = [
              { keys: ["rooftop","roof terrace","toit-terrasse","toit terrasse","sur les toits"], label: "rooftop" },
              { keys: ["swimming pool","piscine"], label: "pool" },
              { keys: ["sea view","ocean view","vue mer","vue sur la mer"], label: "sea view" },
              { keys: ["river view","vue sur la seine","vue sur le fleuve"], label: "river view" },
              { keys: ["mountain view","vue montagne"], label: "mountain view" },
              { keys: ["garden","jardin","patio"], label: "garden/patio" },
              { keys: ["fireplace","cheminée"], label: "fireplace" },
              { keys: ["michelin"], label: "michelin" },
              { keys: ["speakeasy","hidden","secret","caché","souterrain"], label: "speakeasy" },
              { keys: ["dj ","djs ","resident dj"], label: "dj" },
              { keys: ["jazz "], label: "jazz" },
              { keys: ["karaoke"], label: "karaoke" },
              { keys: ["dance floor","piste de danse"], label: "dance floor" },
            ];
            for (const { keys, label } of textFeatures) {
              if (keys.some(k => allText.includes(k)) && !p.features.includes(label)) {
                p.features.push(label);
              }
            }
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

      console.log('Nearby request:', JSON.stringify({ lat: latF, lng: lngF, radius, types, requestCount: responses.length }));
      const filteredCount = type === "Activité" ? responses.reduce((n,r) => n + (r.places||[]).filter(p => p.primaryType && ACTIVITY_BLACKLIST.has(p.primaryType)).length, 0) : 0;
      console.log('Nearby merged:', JSON.stringify({ totalUnique: allPlaces.length, filtered: filteredCount, totalRaw: responses.reduce((n,r) => n + (r.places||[]).length, 0), top5: allPlaces.slice(0,5).map(p=>({name:p.displayName?.text, rating:p.rating})) }));

      return res.status(200).json({ places: allPlaces });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}