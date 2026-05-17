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
      const kids = req.body.kids === true;
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
      // When kids=true on an activity search, drop adult-only sub-types from
      // the Google query (faster + cleaner). Same set is re-checked after the
      // merge as a safety net in case text search drags one back in.
      const KIDS_INCOMPATIBLE = new Set(["casino", "karaoke", "comedy_club", "golf_course"]);
      let types = typeGroups[type] || ["restaurant"];
      if (kids && type === "Activité") {
        types = types.filter(t => !KIDS_INCOMPATIBLE.has(t));
      }

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
        // Translation table: Google indexes places by language. Searching
        // 'rooftop' in a French-locale data returns nothing because Google
        // categorises the same place under 'Toit-terrasse'. For each known
        // mood keyword, expand to its localised variants in the user's
        // language so we hit Google's index in the language it lives in.
        const MOOD_LANG_VARIANTS = {
          rooftop: { fr:["toit-terrasse","terrasse sur le toit","terrasse panoramique"], es:["azotea","terraza panorámica"], de:["Dachterrasse"], it:["terrazza panoramica","terrazza sul tetto"], pt:["terraço","terraço panorâmico"], nl:["dakterras"] },
          speakeasy: { fr:["bar caché","bar secret"], es:["bar oculto"], de:["geheime bar"], it:["bar segreto"], pt:["bar escondido"], nl:["verborgen bar"] },
          romantic: { fr:["romantique"], es:["romántico"], de:["romantisch"], it:["romantico"], pt:["romântico"], nl:["romantisch"] },
          romantique: { en:["romantic"], es:["romántico"], de:["romantisch"], it:["romantico"], pt:["romântico"], nl:["romantisch"] },
          brunch: { fr:["brunch"], es:["brunch"], de:["brunch"], it:["brunch"] },
          terrasse: { en:["terrace","outdoor seating"], es:["terraza"], de:["Terrasse"], it:["terrazza"], pt:["esplanada"], nl:["terras"] },
          terrace: { fr:["terrasse"], es:["terraza"], de:["Terrasse"], it:["terrazza"], pt:["esplanada"], nl:["terras"] },
          piscine: { en:["pool","swimming pool"], es:["piscina"], de:["Schwimmbad"], it:["piscina"], pt:["piscina"], nl:["zwembad"] },
          pool: { fr:["piscine"], es:["piscina"], de:["Schwimmbad"], it:["piscina"], pt:["piscina"], nl:["zwembad"] },
          "live music": { fr:["musique live","concert"], es:["música en vivo"], de:["Live-Musik"], it:["musica dal vivo"], pt:["música ao vivo"], nl:["live muziek"] },
          jazz: { fr:["jazz"], es:["jazz"], de:["jazz"], it:["jazz"] },
        };
        const expandKeyword = (kw) => {
          const lower = kw.toLowerCase().trim();
          const entry = MOOD_LANG_VARIANTS[lower];
          if (!entry) return [kw];
          const variants = [kw, ...(entry[userLang] || []), ...(userLang !== "en" ? (entry.en || []) : [])];
          return [...new Set(variants.map(v => v.trim()).filter(Boolean))];
        };

        const typeSuffix = type === "Restaurant" ? "restaurant"
          : type === "Bar" ? "bar"
          : type === "Café" ? "cafe"
          : type === "Hôtel" ? "hotel"
          // For Activité we tell Google we're looking for an activity / thing
          // to do, otherwise a mood like "enfants" leaks restaurants tagged
          // family-friendly. English suffix works against Google's global index.
          : type === "Activité" ? (kids ? "kids activity" : "activity")
          : "";

        // Clean the full mood string
        const cleanedMood = mood.replace(/[,;]/g, ' ').replace(/\s+/g, ' ').trim();
        const primaryKeyword = mood.split(/[,;]/)[0].trim();

        // Build a deduped list of textQueries: variants of the primary
        // keyword (across languages) combined with the type suffix, plus a
        // 'cleanedMood + type' catch-all.
        const querySet = new Set();
        for (const variant of expandKeyword(primaryKeyword)) {
          if (typeSuffix) querySet.add(`${variant} ${typeSuffix}`.trim());
          querySet.add(variant);
        }
        if (cleanedMood !== primaryKeyword) {
          querySet.add(`${cleanedMood} ${typeSuffix}`.trim());
        }
        const queries = [...querySet];

        // Bigger candidate pool: max=20 per Text Search (was 10). Use
        // locationBias instead of locationRestriction so a slightly-out-of-
        // radius rooftop still surfaces — missing the one rooftop near the
        // user by 100m would be worse than minor radius drift. The actual
        // distance filtering happens client-side anyway.
        const biasRadius = Math.max(radius * 1.5, 3000);
        const textSearches = await Promise.all(queries.map(q =>
          fetch('https://places.googleapis.com/v1/places:searchText', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': key, 'X-Goog-FieldMask': fieldMask },
            body: JSON.stringify({
              textQuery: q,
              maxResultCount: 20,
              locationBias: { circle: { center: { latitude: latF, longitude: lngF }, radius: biasRadius } },
              languageCode: userLang
            }),
          }).then(r => r.json()).catch(() => ({places:[]}))
        ));

        try {
          textSearches.forEach((textData, i) => {
            if (textData.places && textData.places.length > 0) {
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
          // Hard reject: when searching food/drink (Restaurant/Bar/Café), drop
          // accommodation results that the mood text search dragged in.
          // 'toit-terrasse' returns many Airbnb-style apartments and hotel
          // suites — those are NOT what the user wants when they ask for a
          // restaurant with a rooftop.
          const ACCOMMODATION_TYPES = new Set([
            "lodging","hotel","motel","hostel","guest_house","bed_and_breakfast",
            "apartment_hotel","apartment_building","vacation_rental_agency",
            "extended_stay_hotel","resort_hotel","private_guest_room",
            "campground","cottage","inn","japanese_inn","cabin"
          ]);
          if ((type === "Restaurant" || type === "Bar" || type === "Café") && p.primaryType && ACCOMMODATION_TYPES.has(p.primaryType)) return;
          // Hard reject (food/drink search only): non-consumer venues that the
          // mood Text Search drags in by name match — private event venues
          // ("Terrasse des Champs Elysées"), banquet halls, conference centres,
          // wedding venues, etc. They are not places you walk into for a meal,
          // they don't have public hours/website/phone, and the resulting
          // place sheet is empty. Reject them up front.
          const NON_FOOD_VENUE_TYPES = new Set([
            "event_venue","banquet_hall","wedding_venue","convention_center",
            "conference_center","performing_arts_theater","stadium","arena",
            "amusement_park","zoo","aquarium","museum","art_gallery",
            "tourist_attraction","park","church","mosque","synagogue",
            "hindu_temple","place_of_worship","cemetery","funeral_home",
            "school","university","library","hospital","pharmacy","doctor",
            "dentist","gym","fitness_center","spa","beauty_salon","hair_salon",
            "barber_shop","clothing_store","shoe_store","jewelry_store",
            "shopping_mall","bank","atm","post_office","gas_station",
            "car_dealer","car_rental","car_repair","parking","police","embassy",
            "city_hall","courthouse","local_government_office",
            // Service businesses that Google sometimes attaches to rooftops /
            // terraces because the company built or manages them. They are
            // not places you eat or drink.
            "general_contractor","contractor","electrician","plumber","roofing_contractor",
            "real_estate_agency","insurance_agency","accounting","lawyer","notary_public",
            "moving_company","storage","laundry","dry_cleaning",
            "florist","hardware_store","home_goods_store","furniture_store",
            "travel_agency","tourist_information_center"
          ]);
          if ((type === "Restaurant" || type === "Bar" || type === "Café") && p.primaryType && NON_FOOD_VENUE_TYPES.has(p.primaryType)) return;
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
          // For Activité, the cross-type filter is STRICT — applied even to
          // text-search results. A "kids activity" query happily returns
          // family-friendly restaurants and bars, which is not what the user
          // asked for. The blacklist above catches some, this catches the rest.
          if (type === "Activité" && p.primaryType) {
            const pt = p.primaryType;
            if (pt === "restaurant" || pt.endsWith("_restaurant") ||
                pt === "bar" || pt === "night_club" || pt === "wine_bar" || pt === "cocktail_bar" ||
                pt === "cafe" || pt === "coffee_shop" || pt === "bakery" || pt === "tea_house" ||
                pt === "lodging" || pt === "hotel" || pt === "motel" || pt === "hostel") return;
          }
          // Kids exclusion safety net (even if text search dragged one in).
          if (kids && type === "Activité" && p.primaryType && KIDS_INCOMPATIBLE.has(p.primaryType)) return;
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
      let allPlaces = Array.from(seen.values());

      // Eligibility floor: drop places with too few ratings to be trusted
      // (a 5★ from 3 reviews is statistically meaningless). Low enough that
      // genuine neighborhood gems still surface — calibrate up if too noisy.
      const REVIEW_FLOOR = 30;
      allPlaces = allPlaces.filter(p => (p.userRatingCount || 0) >= REVIEW_FLOOR);

      // Sort by rating only — no review-count multiplier. Tourist hotspots no
      // longer crush genuine matches just because they have 50k reviews.
      // Tie-break by review count so two 4.7★ places favor the more established.
      allPlaces.sort((a, b) => {
        const ra = a.rating || 0, rb = b.rating || 0;
        if (rb !== ra) return rb - ra;
        return (b.userRatingCount || 0) - (a.userRatingCount || 0);
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