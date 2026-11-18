import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "./admin";
import { createClient } from "./server";
import type { Database } from "./types";
import { toPreviewInput, type ReviewPageInput } from "@/lib/review-view";
import {
  signAdminPhotoUrls,
  signPublicPhotoUrls,
  signedUrlFor,
  toStoragePath,
  type SignedUrls,
} from "@/lib/storage";
import { summarizeVisits, type VisitSummary } from "@/lib/listing";

/**
 * A sessionless anon client: exactly what a logged-out visitor's RLS allows. The cookie
 * client in ./server carries the viewer's session, and for an admin RLS also returns drafts.
 */
function createAnonClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

/**
 * Signed URLs for the covers of all published cafes.
 *
 * `cafes.cover_photo_url` is a public column with no RLS link to a photo, so a cover is
 * signed only if it is one of that cafe's photos that a logged-out visitor can read
 * (migration 005: its review and cafe are published). Anything else renders as no cover.
 * Values are matched as storage paths, so a pre-007 URL cover matches a bare-path photo row.
 * (The reverse, a pre-007 URL row with a bare-path cover, only arises from a hand-set cover
 * on legacy data and fails closed: no cover.)
 *
 * Every page signs the same set, so a cover gets the same URL on every page for the whole
 * reuse window and `next/image` optimizes it once.
 */
async function getPublicCoverUrls(): Promise<SignedUrls> {
  const anon = createAnonClient();
  const { data: cafes, error } = await anon
    .from("cafes")
    .select("id, cover_photo_url")
    .eq("status", "published")
    .not("cover_photo_url", "is", null);
  if (error) {
    console.error("getPublicCoverUrls: cafes query failed", error);
    return {};
  }
  if (cafes.length === 0) return {};

  // Look up only the cover values themselves (as stored and as bare paths), so the result
  // stays small and can't hit PostgREST's row limit.
  const candidates = new Set<string>();
  for (const c of cafes) {
    if (c.cover_photo_url) candidates.add(c.cover_photo_url);
    const path = toStoragePath(c.cover_photo_url);
    if (path) candidates.add(path);
  }
  const { data: photos, error: photosError } = await anon
    .from("photos")
    .select("cafe_id, photo_url")
    .in("cafe_id", cafes.map((c) => c.id))
    .in("photo_url", [...candidates]);
  if (photosError) {
    console.error("getPublicCoverUrls: photos query failed", photosError);
    return {};
  }

  const visible = new Set(photos.map((p) => `${p.cafe_id}:${toStoragePath(p.photo_url)}`));
  const covers = cafes
    .map((c) => toStoragePath(c.cover_photo_url))
    .filter((path, i): path is string => path !== null && visible.has(`${cafes[i].id}:${path}`));
  return signPublicPhotoUrls(covers);
}

function withCover<T extends { cover_photo_url: string | null }>(cafe: T, urls: SignedUrls): T {
  return { ...cafe, cover_photo_url: signedUrlFor(urls, cafe.cover_photo_url) };
}

/** Swap each photo's stored path for its signed URL; drop photos that couldn't be signed. */
function withPhotoUrls<T extends { photo_url: string }>(photos: T[], urls: SignedUrls): T[] {
  return photos.flatMap((p) => {
    const url = signedUrlFor(urls, p.photo_url);
    return url ? [{ ...p, photo_url: url }] : [];
  });
}

/**
 * Public cafe lists and the cafe page read `listed_cafes` (migration 009): published cafes
 * with at least one published review. A cafe with only drafts, or none, is never listed
 * and its page 404s, for anon and for a signed-in admin alike.
 */
export async function getCafes(opts?: { limit?: number }) {
  const sb = await createClient();
  let query = sb
    .from("listed_cafes")
    .select("*")
    .order("overall_rating", { ascending: false, nullsFirst: false });

  if (opts?.limit) query = query.limit(opts.limit);

  const [{ data, error }, coverUrls] = await Promise.all([query, getPublicCoverUrls()]);
  if (error) throw error;
  return (data ?? []).map((c) => withCover(c, coverUrls));
}

/**
 * For the cafe cards: each listed cafe's latest published verdict and visit date, and its
 * published visit count. Sessionless anon client plus an explicit published filter, so an
 * admin's session never leaks a draft verdict onto a public card.
 *
 * On a query error it logs and returns `{}`: the cards still render (name, cover, score),
 * just without verdicts or visit counts, rather than taking the whole page down.
 */
export async function getVisitSummaries(cafeIds: string[]): Promise<Record<string, VisitSummary>> {
  if (cafeIds.length === 0) return {};
  const anon = createAnonClient();
  const { data, error } = await anon
    .from("reviews")
    .select("cafe_id, verdict, date_visited, created_at")
    .in("cafe_id", cafeIds)
    .eq("status", "published");
  if (error) {
    console.error("getVisitSummaries: reviews query failed", error);
    return {};
  }
  return summarizeVisits(data);
}

/**
 * Slugs for the sitemap: every listed cafe (published, with a published review), read as a
 * logged-out visitor. Throws on a query error, so a failed read is a 500 the crawler retries,
 * not a sitemap that silently drops every cafe.
 */
export async function getSitemapCafes(): Promise<{ slug: string; updated_at: string }[]> {
  const { data, error } = await createAnonClient().from("listed_cafes").select("slug, updated_at").order("slug");
  if (error) throw new Error(`getSitemapCafes: ${error.message}`);
  return data;
}

export async function getCafeBySlug(slug: string) {
  const sb = await createClient();
  const { data: cafe, error } = await sb
    .from("listed_cafes")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error) console.error("getCafeBySlug: cafe query failed", error);
  if (!cafe) return null;

  const { data: reviews, error: reviewsError } = await sb
    .from("reviews")
    .select("*, author:profiles(display_name)")
    .eq("cafe_id", cafe.id)
    .eq("status", "published")
    .order("date_visited", { ascending: false });

  // Don't let a failed reviews query (e.g. the author embed) look like "no reviews" silently.
  if (reviewsError) console.error("getCafeBySlug: reviews query failed", reviewsError);

  // Only items and photos that belong to a published review. RLS enforces this too
  // (migration 005); this is defence in depth.
  const reviewIds = (reviews ?? []).map((r) => r.id);
  const publicCafe = withCover(cafe, await getPublicCoverUrls());
  if (reviewIds.length === 0) return { ...publicCafe, reviews: reviews ?? [], items: [], photos: [] };

  const [{ data: items }, { data: photos }] = await Promise.all([
    sb.from("items").select("*").eq("cafe_id", cafe.id).in("review_id", reviewIds),
    sb.from("photos").select("*").eq("cafe_id", cafe.id).in("review_id", reviewIds),
  ]);
  const photoUrls = await signPublicPhotoUrls((photos ?? []).map((p) => p.photo_url));

  return {
    ...publicCafe,
    reviews: reviews ?? [],
    items: items ?? [],
    photos: withPhotoUrls(photos ?? [], photoUrls),
  };
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
  const query = sb
    .from("listed_cafes")
    .select("id, name, slug, lat, lng, neighborhood, overall_rating, cover_photo_url, vibe_tags")
    .not("lat", "eq", 0);

  const [{ data, error }, coverUrls] = await Promise.all([query, getPublicCoverUrls()]);
  if (error) throw error;
  return (data ?? []).map((c) => withCover(c, coverUrls));
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
  // Admin sees every photo, drafts included, through fresh signed URLs.
  const urls = await signAdminPhotoUrls([
    cafe.cover_photo_url,
    ...(photos ?? []).map((p) => p.photo_url),
  ]);

  return {
    ...withCover(cafe, urls),
    reviews: reviews ?? [],
    items: items ?? [],
    photos: withPhotoUrls(photos ?? [], urls),
  };
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
    // Two relationships link reviews and photos after migration 008 (photos.review_id and
    // reviews.cover_photo_id), so the embed names the one it means.
    .select("*, cafes(name, slug, neighborhood, address, lat, lng), items(*), photos!photos_review_id_fkey(*)")
    .eq("id", id)
    .single();
  if (!data) return data;

  const photos = data.photos ?? [];
  const urls = await signAdminPhotoUrls(photos.map((p) => p.photo_url));
  return { ...data, photos: withPhotoUrls(photos, urls) };
}

/**
 * The admin draft preview's data: this review (any status), its cafe, and the cafe's
 * published reviews, with only those reviews' items and photos. Admin client, called only
 * from the authenticated preview page. Photos are signed fresh; unsignable ones are dropped.
 */
export async function getReviewPreview(
  reviewId: string,
): Promise<{ input: ReviewPageInput; leadVisitId: string } | null> {
  const sb = createAdminClient();
  const { data: review, error } = await sb
    .from("reviews")
    .select("*, author:profiles(display_name)")
    .eq("id", reviewId)
    .maybeSingle();
  if (error) console.error("getReviewPreview: review query failed", error);
  if (!review) return null;

  const [cafeRes, publishedRes] = await Promise.all([
    sb
      .from("cafes")
      .select("name, slug, neighborhood, address, lat, lng, vibe_tags, google_place_id")
      .eq("id", review.cafe_id)
      .maybeSingle(),
    sb
      .from("reviews")
      .select("*, author:profiles(display_name)")
      .eq("cafe_id", review.cafe_id)
      .eq("status", "published"),
  ]);
  if (cafeRes.error) console.error("getReviewPreview: cafe query failed", cafeRes.error);
  if (publishedRes.error) console.error("getReviewPreview: published query failed", publishedRes.error);
  if (!cafeRes.data) return null;

  const published = publishedRes.data ?? [];
  const ids = [...new Set([review.id, ...published.map((r) => r.id)])];
  const [itemsRes, photosRes] = await Promise.all([
    sb.from("items").select("*").in("review_id", ids).order("created_at"),
    sb.from("photos").select("*").in("review_id", ids).order("created_at"),
  ]);
  if (itemsRes.error) console.error("getReviewPreview: items query failed", itemsRes.error);
  if (photosRes.error) console.error("getReviewPreview: photos query failed", photosRes.error);

  const photos = photosRes.data ?? [];
  const urls = await signAdminPhotoUrls(photos.map((p) => p.photo_url));
  return toPreviewInput({
    review,
    cafe: cafeRes.data,
    published,
    items: itemsRes.data ?? [],
    photos: withPhotoUrls(photos, urls),
  });
}
