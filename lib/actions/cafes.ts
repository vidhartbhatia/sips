"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import { syncCoverPhoto } from "@/lib/cover-photo";
import { toStoragePath } from "@/lib/storage";
import { geocodeAddress } from "@/lib/google/geocode";
import {
  autocompletePlaces,
  isPlaceId,
  isSessionToken,
  placeDetails,
  type PlaceDetails,
  type PlaceSuggestion,
  type PlacesResult,
} from "@/lib/google/places";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const isLat = (n: unknown): n is number => typeof n === "number" && Number.isFinite(n) && Math.abs(n) <= 90;
const isLng = (n: unknown): n is number => typeof n === "number" && Number.isFinite(n) && Math.abs(n) <= 180;

/**
 * Create a cafe. From the capture form's place search it arrives with Google's address,
 * coordinates and place ID, so nothing is geocoded; added by name only, it has no address
 * yet and can't be published until one is set on /admin/cafes/<slug>/edit.
 */
export async function createCafe(data: {
  name: string;
  address?: string;
  neighborhood: string;
  vibe_tags?: string[];
  lat?: number;
  lng?: number;
  google_place_id?: string;
}) {
  await requireAuth();
  if (data.google_place_id !== undefined && !isPlaceId(data.google_place_id)) {
    return { error: "That Google place ID doesn't look right.", cafe: null };
  }
  const hasCoords = data.lat !== undefined || data.lng !== undefined;
  if (hasCoords && !(isLat(data.lat) && isLng(data.lng))) {
    return { error: "Those coordinates don't look right.", cafe: null };
  }
  const supabase = createAdminClient();
  const slug = slugify(data.name);

  // Check for duplicate slug
  const { data: existing } = await supabase
    .from("cafes")
    .select("id")
    .eq("slug", slug)
    .single();

  if (existing) {
    return { error: "A cafe with this name already exists", cafe: null };
  }

  // Coordinates from the place search win; otherwise geocode the address, if there is one.
  const coords =
    isLat(data.lat) && isLng(data.lng)
      ? { lat: data.lat, lng: data.lng }
      : data.address
        ? await geocodeAddress(data.address)
        : null;

  const { data: cafe, error } = await supabase
    .from("cafes")
    .insert({
      name: data.name,
      slug,
      address: data.address ?? "",
      neighborhood: data.neighborhood,
      lat: coords?.lat ?? 0,
      lng: coords?.lng ?? 0,
      vibe_tags: data.vibe_tags ?? [],
      google_place_id: data.google_place_id ?? null,
      // No reviews yet: no score (null, never 0).
      overall_rating: null,
      status: "published",
    })
    .select()
    .single();

  if (error) return { error: error.message, cafe: null };
  return { error: null, cafe };
}

export async function updateCafe(
  cafeId: string,
  data: {
    name?: string;
    address?: string;
    neighborhood?: string;
    vibe_tags?: string[];
    cover_photo_url?: string | null;
  }
) {
  await requireAuth();
  const supabase = createAdminClient();

  // Re-geocode if address changed
  let coords: { lat: number; lng: number } | null = null;
  if (data.address) {
    coords = await geocodeAddress(data.address);
  }

  const updateData: Record<string, unknown> = { ...data };
  // A cover is stored as a photos-bucket path (the admin UI may hand back a signed URL).
  if ("cover_photo_url" in data) updateData.cover_photo_url = toStoragePath(data.cover_photo_url);
  if (coords) {
    updateData.lat = coords.lat;
    updateData.lng = coords.lng;
  }

  const { error } = await supabase
    .from("cafes")
    .update(updateData)
    .eq("id", cafeId);

  if (error) return { error: error.message };

  // A hand-set cover is kept, unless it's a photo of an unpublished review
  if ("cover_photo_url" in data) await syncCoverPhoto(supabase, cafeId);

  return { error: null };
}

// Public read: anon client + RLS, scoped to published cafes only.
// Previously used the service-role admin client with no auth check, which
// would have leaked draft cafe names through any client that could call
// this action. Its caller (the capture form's CafePicker) only attaches
// reviews to published cafes, so published-only is correct.
export async function searchCafes(query: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cafes")
    .select("id, name, slug, neighborhood")
    .eq("status", "published")
    .ilike("name", `%${query}%`)
    .limit(10);

  if (error) return [];
  return data ?? [];
}

/** Google place suggestions for the capture form's "new cafe" search. Signed-in only. */
export async function searchPlaces(input: string, sessionToken: string): Promise<PlacesResult<PlaceSuggestion[]>> {
  await requireAuth();
  const text = typeof input === "string" ? input.trim() : "";
  if (text.length < 2 || text.length > 100) return { ok: true, data: [] };
  if (typeof sessionToken !== "string" || !isSessionToken(sessionToken)) {
    return { ok: false, error: "Bad search session." };
  }
  return autocompletePlaces(text, sessionToken);
}

/** The picked place's name, address, coordinates and suggested neighbourhood. Signed-in only. */
export async function getPlace(placeId: string, sessionToken: string): Promise<PlacesResult<PlaceDetails>> {
  await requireAuth();
  if (typeof placeId !== "string" || !isPlaceId(placeId)) return { ok: false, error: "Unknown place." };
  if (typeof sessionToken !== "string" || !isSessionToken(sessionToken)) {
    return { ok: false, error: "Bad search session." };
  }
  return placeDetails(placeId, sessionToken);
}
