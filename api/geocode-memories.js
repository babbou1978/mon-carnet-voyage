export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { places } = req.body;
  if (!places?.length) return res.status(200).json({ results: [] });

  const key = process.env.GOOGLE_PLACES_KEY;
  
  const results = await Promise.allSettled(
    places.map(async (place) => {
      // Build the most specific query possible - use address if available
      const query = place.address
        ? `${place.name}, ${place.address}`
        : [place.name, place.city, place.country].filter(Boolean).join(', ');
      try {
        const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${key}&language=en`;
        const r = await fetch(url);
        const data = await r.json();
        if (data.status === 'OK' && data.results?.[0]) {
          const loc = data.results[0].geometry.location;
          return { id: place.id, lat: loc.lat, lng: loc.lng, formatted: data.results[0].formatted_address };
        }
        console.error(`Geocode failed for "${query}": ${data.status}`);
        return { id: place.id, lat: null, lng: null };
      } catch (e) {
        console.error(`Geocode error for "${query}":`, e.message);
        return { id: place.id, lat: null, lng: null };
      }
    })
  );

  const processed = results.map(r => r.status === 'fulfilled' ? r.value : { id: null, lat: null, lng: null });
  res.status(200).json({ results: processed });
}
