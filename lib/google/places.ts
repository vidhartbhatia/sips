/**
 * Google Places API (New) over REST: autocomplete a cafe name, then fetch the picked place's
 * address and coordinates. Server-only: it uses `GOOGLE_GEOCODING_API_KEY` (same Google
 * project as lib/google/geocode.ts), which never reaches the browser. Called only from the
 * authenticated Server Actions in lib/actions/cafes.ts.
 *
 * Failures come back as `{ error }` rather than throwing, so the capture form can fall back
 * to adding the cafe by name.
 */
import { neighborhoodFromComponents, type AddressComponent } from "@/lib/neighborhoods";

export interface PlaceSuggestion {
  placeId: string;
  name: string;
  /** Street and city, e.g. "East Union Street, Seattle, WA, USA". */
  detail: string;
}

export interface PlaceDetails {
  placeId: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  /** One of NEIGHBORHOODS, or null when Google's address doesn't map onto one. */
  neighborhood: string | null;
}

export type PlacesResult<T> = { ok: true; data: T } | { ok: false; error: string };

const BASE = "https://places.googleapis.com/v1";
// Downtown Seattle; 20 km covers the city and the near suburbs.
const SEATTLE = { latitude: 47.6062, longitude: -122.3321 };
const RADIUS_M = 20_000;
// A hard filter on the place's primary type. If it finds nothing (a cafe Google files as a
// restaurant), the search runs again without it.
const CAFE_TYPES = ["cafe", "coffee_shop", "bakery", "tea_house"];

/** Place IDs go into a URL path, so only Google's ID alphabet is allowed. */
export const isPlaceId = (s: string) => /^[A-Za-z0-9_-]{10,300}$/.test(s);
/** Google wants a URL-safe string of at most 36 characters; we send a v4 UUID. */
export const isSessionToken = (s: string) => /^[A-Za-z0-9_-]{8,36}$/.test(s);

function apiKey(): string {
  return process.env.GOOGLE_GEOCODING_API_KEY?.trim() ?? "";
}

/**
 * The signed-in e2e job (local Supabase stack) must never call Google. It sets
 * E2E_LOCAL_SUPABASE=1; requiring a local Supabase URL as well means a stray flag on a real
 * deployment can't switch the fake on.
 */
function fakeEnabled(): boolean {
  return (
    process.env.E2E_LOCAL_SUPABASE === "1" &&
    /^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "")
  );
}

async function google<T>(path: string, init: RequestInit, fieldMask: string): Promise<PlacesResult<T>> {
  const key = apiKey();
  if (!key) return { ok: false, error: "Place search isn't set up (no Google key)." };
  try {
    const res = await fetch(`${BASE}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", "X-Goog-Api-Key": key, "X-Goog-FieldMask": fieldMask },
      cache: "no-store",
    });
    if (!res.ok) {
      // 403 = API not enabled for the key; 400 = bad request. Log the body, show a short reason.
      console.error(`[places] ${path.split("?")[0]} → ${res.status}`, (await res.text()).slice(0, 500));
      return { ok: false, error: `Google place search failed (${res.status}).` };
    }
    return { ok: true, data: (await res.json()) as T };
  } catch (err) {
    console.error("[places] request failed", err);
    return { ok: false, error: "Couldn't reach Google place search." };
  }
}

interface AutocompleteResponse {
  suggestions?: {
    placePrediction?: {
      placeId: string;
      structuredFormat?: { mainText?: { text: string }; secondaryText?: { text: string } };
      text?: { text: string };
    };
  }[];
}

async function autocompleteOnce(input: string, sessionToken: string, types: string[] | null) {
  const res = await google<AutocompleteResponse>(
    "/places:autocomplete",
    {
      method: "POST",
      body: JSON.stringify({
        input,
        sessionToken,
        locationBias: { circle: { center: SEATTLE, radius: RADIUS_M } },
        includedRegionCodes: ["us"],
        languageCode: "en",
        ...(types && { includedPrimaryTypes: types }),
      }),
    },
    "suggestions.placePrediction.placeId,suggestions.placePrediction.structuredFormat,suggestions.placePrediction.text",
  );
  if (!res.ok) return res;
  const suggestions = (res.data.suggestions ?? []).flatMap(({ placePrediction: p }) =>
    p
      ? [
          {
            placeId: p.placeId,
            name: p.structuredFormat?.mainText?.text ?? p.text?.text ?? "",
            detail: p.structuredFormat?.secondaryText?.text ?? "",
          },
        ]
      : [],
  );
  return { ok: true as const, data: suggestions };
}

/** Up to five suggestions for what Lea has typed, biased to Seattle and to cafes. */
export async function autocompletePlaces(input: string, sessionToken: string): Promise<PlacesResult<PlaceSuggestion[]>> {
  if (fakeEnabled()) return { ok: true, data: fakeSuggestions(input) };
  const typed = await autocompleteOnce(input, sessionToken, CAFE_TYPES);
  if (typed.ok && typed.data.length > 0) return typed;
  return autocompleteOnce(input, sessionToken, null);
}

interface DetailsResponse {
  id: string;
  displayName?: { text: string };
  formattedAddress?: string;
  location?: { latitude: number; longitude: number };
  addressComponents?: AddressComponent[];
}

/** The picked place's name, address, coordinates and suggested neighbourhood. Ends the session. */
export async function placeDetails(placeId: string, sessionToken: string): Promise<PlacesResult<PlaceDetails>> {
  if (fakeEnabled()) return fakeDetails(placeId);
  const res = await google<DetailsResponse>(
    `/places/${encodeURIComponent(placeId)}?sessionToken=${encodeURIComponent(sessionToken)}&languageCode=en`,
    { method: "GET" },
    "id,displayName,formattedAddress,location,addressComponents",
  );
  if (!res.ok) return res;
  const d = res.data;
  if (!d.location || !d.formattedAddress) return { ok: false, error: "Google has no address for that place." };
  return {
    ok: true,
    data: {
      placeId: d.id,
      name: d.displayName?.text ?? "",
      address: d.formattedAddress,
      lat: d.location.latitude,
      lng: d.location.longitude,
      neighborhood: neighborhoodFromComponents(d.addressComponents),
    },
  };
}

// ---------------------------------------------------------------------------
// Test double for the signed-in e2e job (see fakeEnabled). Never used against real Supabase.
// ---------------------------------------------------------------------------

const FAKE_PLACES: (PlaceDetails & { detail: string; components: AddressComponent[] })[] = [
  {
    placeId: "e2e_fake_place_capitol_hill",
    name: "E2E Place Cafe",
    detail: "East Pike Street, Seattle, WA, USA",
    address: "1000 E Pike St, Seattle, WA 98122, USA",
    lat: 47.6139,
    lng: -122.3194,
    neighborhood: null,
    components: [
      { longText: "Capitol Hill", shortText: "Capitol Hill", types: ["neighborhood", "political"] },
      { longText: "Seattle", shortText: "Seattle", types: ["locality", "political"] },
    ],
  },
];

function fakeSuggestions(input: string): PlaceSuggestion[] {
  if (input.trim().length < 2) return [];
  return FAKE_PLACES.map(({ placeId, name, detail }) => ({ placeId, name, detail }));
}

function fakeDetails(placeId: string): PlacesResult<PlaceDetails> {
  const p = FAKE_PLACES.find((f) => f.placeId === placeId);
  if (!p) return { ok: false, error: "Google has no address for that place." };
  const { placeId: id, name, address, lat, lng, components } = p;
  return { ok: true, data: { placeId: id, name, address, lat, lng, neighborhood: neighborhoodFromComponents(components) } };
}
