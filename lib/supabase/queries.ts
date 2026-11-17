import { createAdminClient } from "./admin";
import { createClient } from "./server";
import { signAdminPhotoUrls, signPublicPhotoUrls, signedUrlFor, type SignedUrls } from "@/lib/storage";

type PublicClient = Awaited<ReturnType<typeof createClient>>;

/**
 * Signed URLs for the covers of all published cafes.
 *
 * `cafes.cover_photo_url` is a public column with no RLS link to a photo, so a cover is
 * signed only if it is a photo row that anon can read (migration 005: its review and cafe
 * are published). Anything else renders as no cover.
 *
 * Every page signs the same set, so a cover gets the same URL on every page for the whole
 * reuse window and `next/image` optimizes it once.
 */
async function getPublicCoverUrls(sb: PublicClient): Promise<SignedUrls> {
  const { data: cafes, error } = await sb
    .from("cafes")
    .select("cover_photo_url")
    .eq("status", "published")
    .not("cover_photo_url", "is", null);
  if (error) {
    console.error("getPublicCoverUrls: cafes query failed", error);
    return {};
  }
  const covers = [...new Set(cafes.map((c) => c.cover_photo_url).filter((v): v is string => !!v))];
  if (covers.length === 0) return {};

  const { data: photos, error: photosError } = await sb
    .from("photos")
    .select("photo_url")
    .in("photo_url", covers);
  if (photosError) {
    console.error("getPublicCoverUrls: photos query failed", photosError);
    return {};
  }
  return signPublicPhotoUrls(photos.map((p) => p.photo_url));
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

  const [{ data, error }, coverUrls] = await Promise.all([query, getPublicCoverUrls(sb)]);
  if (error) throw error;
  return (data ?? []).map((c) => withCover(c, coverUrls));
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
  const publicCafe = withCover(cafe, await getPublicCoverUrls(sb));
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
    .from("cafes")
    .select("id, name, slug, lat, lng, neighborhood, overall_rating, cover_photo_url, vibe_tags")
    .eq("status", "published")
    .not("lat", "eq", 0);

  const [{ data, error }, coverUrls] = await Promise.all([query, getPublicCoverUrls(sb)]);
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
    .select("*, cafes(name, slug, neighborhood), items(*), photos(*)")
    .eq("id", id)
    .single();
  if (!data) return data;

  const photos = data.photos ?? [];
  const urls = await signAdminPhotoUrls(photos.map((p) => p.photo_url));
  return { ...data, photos: withPhotoUrls(photos, urls) };
}
