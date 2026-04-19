// Geocode a list of place names/cities to get coordinates
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { places } = req.body;
  if (!places?.length) return res.status(200).json({ results: [] });

  const key = process.env.GOOGLE_PLACES_KEY;
  const results = await Promise.all(
    places.map(async (place) => {
      const query = [place.name, place.city, place.country].filter(Boolean).join(', ');
      try {
        const r = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${key}&language=fr`);
        const data = await r.json();
        if (data.results?.[0]) {
          const loc = data.results[0].geometry.location;
          return { id: place.id, lat: loc.lat, lng: loc.lng };
        }
      } catch {}
      return { id: place.id, lat: null, lng: null };
    })
  );
  res.status(200).json({ results });
}
