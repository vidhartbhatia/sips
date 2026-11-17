import { createAdminClient } from "./admin";
import { createClient } from "./server";

export async function getCafes(opts?: {
  status?: "published" | "draft";
  limit?: number;
}) {
  const sb = await createClient();
  let query = sb
    .from("cafes")
    .select("*")
    .order("overall_rating", { ascending: false, nullsFirst: false });

  query = query.eq("status", opts?.status ?? "published");
  if (opts?.limit) query = query.limit(opts.limit);

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function getCafeBySlug(slug: string) {
  const sb = await createClient();
  const { data: cafe, error } = await sb
    .from("cafes")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (error) return null;

  const [{ data: reviews, error: reviewsError }, { data: items }, { data: photos }] = await Promise.all([
    sb
      .from("reviews")
      .select("*, author:profiles(display_name)")
      .eq("cafe_id", cafe.id)
      .eq("status", "published")
      .order("date_visited", { ascending: false }),
    sb.from("items").select("*").eq("cafe_id", cafe.id),
    sb.from("photos").select("*").eq("cafe_id", cafe.id),
  ]);

  // Don't let a failed reviews query (e.g. the author embed) look like "no reviews" silently.
  if (reviewsError) console.error("getCafeBySlug: reviews query failed", reviewsError);

  return { ...cafe, reviews: reviews ?? [], items: items ?? [], photos: photos ?? [] };
}

export async function getRecentReviews(limit = 5) {
  const sb = await createClient();
  const { data, error } = await sb
    .from("reviews")
    .select("*, cafes(name, slug, neighborhood)")
    .eq("status", "published")
    .order("date_visited", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}

export async function getWantToGo() {
  const sb = await createClient();
  const { data, error } = await sb
    .from("want_to_go")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getCafesForMap() {
  const sb = await createClient();
  const { data, error } = await sb
    .from("cafes")
    .select("id, name, slug, lat, lng, neighborhood, overall_rating, cover_photo_url, vibe_tags")
    .eq("status", "published")
    .not("lat", "eq", 0);

  if (error) throw error;
  return data ?? [];
}

export async function getAdminStats() {
  const sb = createAdminClient();

  const [cafes, reviews, drafts, photos] = await Promise.all([
    sb.from("cafes").select("id", { count: "exact", head: true }),
    sb.from("reviews").select("id", { count: "exact", head: true }),
    sb.from("reviews").select("id", { count: "exact", head: true }).eq("status", "draft"),
    sb.from("photos").select("id", { count: "exact", head: true }),
  ]);

  return {
    totalCafes: cafes.count ?? 0,
    totalReviews: reviews.count ?? 0,
    draftCount: drafts.count ?? 0,
    photoCount: photos.count ?? 0,
  };
}

export async function getRecentDrafts(limit = 5) {
  const sb = createAdminClient();
  const { data } = await sb
    .from("reviews")
    .select("id, overall_rating, note, date_visited, cafe_id, cafes(name, slug)")
    .eq("status", "draft")
    .order("created_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}

export async function getRecentReviewsAdmin(limit = 5) {
  const sb = createAdminClient();
  const { data } = await sb
    .from("reviews")
    .select("id, overall_rating, note, date_visited, status, cafes(name, slug)")
    .order("created_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}

export async function getCafeBySlugAdmin(slug: string) {
  const sb = createAdminClient();
  const { data: cafe, error } = await sb
    .from("cafes")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error) return null;

  const [{ data: reviews }, { data: items }, { data: photos }] = await Promise.all([
    sb.from("reviews").select("*").eq("cafe_id", cafe.id).order("date_visited", { ascending: false }),
    sb.from("items").select("*").eq("cafe_id", cafe.id),
    sb.from("photos").select("*").eq("cafe_id", cafe.id),
  ]);

  return { ...cafe, reviews: reviews ?? [], items: items ?? [], photos: photos ?? [] };
}

export async function getAllCafesAdmin() {
  const sb = createAdminClient();
  const { data } = await sb
    .from("cafes")
    .select("id, name, slug, neighborhood, address, overall_rating, status, cover_photo_url")
    .order("name");
  return data ?? [];
}

export async function getReviewById(id: string) {
  const sb = createAdminClient();
  const { data } = await sb
    .from("reviews")
    .select("*, cafes(name, slug, neighborhood), items(*), photos(*)")
    .eq("id", id)
    .single();
  return data;
}
