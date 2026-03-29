/**
 * Geocode an address to lat/lng using Nominatim (OpenStreetMap).
 * Free, no API key needed. Rate limited to 1 req/sec.
 */
export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?${new URLSearchParams({
        q: address,
        format: 'json',
        limit: '1',
      })}`,
      { headers: { 'User-Agent': 'ServiceOfficial/1.0' } }
    )

    const data = await res.json()
    if (data.length > 0) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
    }
    return null
  } catch {
    return null
  }
}
