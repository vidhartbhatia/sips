/**
 * Google Geocoding helpers for imports that lack coordinates.
 *
 * Uses the server-only `GOOGLE_GEOCODING_API_KEY` (no `NEXT_PUBLIC_` prefix
 * so it never ships to the browser bundle). There is deliberately no fallback
 * to `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`: that key is HTTP-referrer restricted
 * and not enabled for the Geocoding API, so a server-side call with it fails.
 */

function resolveApiKey(): string {
  return process.env.GOOGLE_GEOCODING_API_KEY?.trim() ?? "";
}

// ---------------------------------------------------------------------------
// Geocode an address string via Google Geocoding API
// ---------------------------------------------------------------------------

export async function geocodeAddress(
  address: string
): Promise<{ lat: number; lng: number } | null> {
  const apiKey = resolveApiKey();
  if (!apiKey) {
    console.warn(
      "[geocode] GOOGLE_GEOCODING_API_KEY is not set — skipping geocode"
    );
    return null;
  }

  const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
  url.searchParams.set("address", address);
  url.searchParams.set("key", apiKey);

  try {
    const res = await fetch(url.toString());
    if (!res.ok) return null;

    const data = (await res.json()) as {
      status: string;
      results: { geometry: { location: { lat: number; lng: number } } }[];
    };

    if (data.status !== "OK" || data.results.length === 0) {
      // ZERO_RESULTS is a normal miss; anything else (REQUEST_DENIED,
      // OVER_QUERY_LIMIT) means the key or quota is broken, so say so in logs.
      if (data.status !== "ZERO_RESULTS") {
        console.error(`[geocode] Google returned ${data.status}`);
      }
      return null;
    }

    const loc = data.results[0].geometry.location;
    return { lat: loc.lat, lng: loc.lng };
  } catch (err) {
    console.error("Geocoding failed:", err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Extract coordinates from a Google Maps URL
// ---------------------------------------------------------------------------

/**
 * Many Google Maps URLs embed coordinates in one of these patterns:
 *  - /maps/@47.6062,-122.3321,15z
 *  - /maps?q=47.6062,-122.3321
 *  - /maps/place/.../@47.6062,-122.3321,...
 *  - ll=47.6062,-122.3321
 *
 * Returns the first valid lat/lng pair found, or null.
 */
export function extractCoordsFromGoogleMapsUrl(
  url: string
): { lat: number; lng: number } | null {
  // Pattern 1: /@lat,lng in the path
  const atMatch = url.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (atMatch) {
    const lat = parseFloat(atMatch[1]);
    const lng = parseFloat(atMatch[2]);
    if (isValidCoord(lat, lng)) return { lat, lng };
  }

  // Pattern 2: ?q=lat,lng or &q=lat,lng
  const qMatch = url.match(/[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (qMatch) {
    const lat = parseFloat(qMatch[1]);
    const lng = parseFloat(qMatch[2]);
    if (isValidCoord(lat, lng)) return { lat, lng };
  }

  // Pattern 3: ll=lat,lng
  const llMatch = url.match(/ll=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (llMatch) {
    const lat = parseFloat(llMatch[1]);
    const lng = parseFloat(llMatch[2]);
    if (isValidCoord(lat, lng)) return { lat, lng };
  }

  return null;
}

function isValidCoord(lat: number, lng: number): boolean {
  return (
    !isNaN(lat) &&
    !isNaN(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}
