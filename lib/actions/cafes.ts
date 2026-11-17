"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import { syncCoverPhoto } from "@/lib/cover-photo";
import { geocodeAddress } from "@/lib/google/geocode";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function createCafe(data: {
  name: string;
  address?: string;
  neighborhood: string;
  vibe_tags?: string[];
}) {
  await requireAuth();
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

  // Geocode if address provided
  const coords = data.address ? await geocodeAddress(data.address) : null;

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
      overall_rating: 0,
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
// this action. Both current callers (admin quick-add, admin review/new)
// only attach reviews to published cafes, so published-only is correct.
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
