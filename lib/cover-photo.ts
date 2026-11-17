import type { createAdminClient } from "@/lib/supabase/admin";

type AdminClient = ReturnType<typeof createAdminClient>;

/**
 * Keep `cafes.cover_photo_url` pointing at a photo of a *published* review.
 *
 * `cafes` rows are public, so the cover must never come from a draft (or deleted)
 * review. Call after any change to a cafe's reviews or photos:
 * - no cover → use the oldest published-review photo, if any
 * - cover is a review photo that is no longer published → re-pick, or null
 * - cover that isn't one of the cafe's review photos (set by hand) → left alone
 *
 * Not a Server Action: callers are authenticated actions that pass the admin client.
 */
export async function syncCoverPhoto(
  supabase: AdminClient,
  cafeId: string,
  opts: { removedUrls?: string[] } = {}
): Promise<void> {
  const [{ data: cafe }, { data: photos }, { data: published }] = await Promise.all([
    supabase.from("cafes").select("cover_photo_url").eq("id", cafeId).single(),
    supabase
      .from("photos")
      .select("photo_url, review_id")
      .eq("cafe_id", cafeId)
      .order("created_at", { ascending: true }),
    supabase.from("reviews").select("id").eq("cafe_id", cafeId).eq("status", "published"),
  ]);
  if (!cafe) return;

  const publishedIds = new Set((published ?? []).map((r) => r.id));
  const publishedUrls = (photos ?? [])
    .filter((p) => p.review_id !== null && publishedIds.has(p.review_id))
    .map((p) => p.photo_url);

  const current = cafe.cover_photo_url;
  const reviewPhotoUrls = new Set([
    ...(photos ?? []).map((p) => p.photo_url),
    ...(opts.removedUrls ?? []),
  ]);

  const needsPick =
    current === null || (reviewPhotoUrls.has(current) && !publishedUrls.includes(current));
  if (!needsPick) return;

  const next = publishedUrls[0] ?? null;
  if (next === current) return;

  await supabase.from("cafes").update({ cover_photo_url: next }).eq("id", cafeId);
}
