import type { createAdminClient } from "@/lib/supabase/admin";

type AdminClient = ReturnType<typeof createAdminClient>;

type Visit = { id: string; date_visited: string; created_at: string; cover_photo_id: string | null };
type VisitPhoto = { id: string; review_id: string | null; photo_url: string; created_at: string };

/**
 * The cafe cover for a set of published visits: the latest visit's chosen cover
 * (`reviews.cover_photo_id`), else that visit's oldest photo, else null. Only the latest
 * visit counts (spec: the cafe cover is the latest published visit's cover). A cover id
 * that isn't one of that visit's own photos is ignored, so a draft's photo can't become
 * the public cover.
 */
export function pickCafeCover(published: readonly Visit[], photos: readonly VisitPhoto[]): string | null {
  const latest = [...published].sort(
    (a, b) => b.date_visited.localeCompare(a.date_visited) || b.created_at.localeCompare(a.created_at),
  )[0];
  if (!latest) return null;
  const own = photos
    .filter((p) => p.review_id === latest.id)
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
  const chosen = own.find((p) => p.id === latest.cover_photo_id);
  return (chosen ?? own[0])?.photo_url ?? null;
}

/**
 * Keep `cafes.cover_photo_url` equal to the latest published visit's cover.
 *
 * `cafes` rows are public, so the cover must only ever be a photo of a *published*
 * review. Call after any change to a cafe's reviews, photos or a visit's cover. The
 * public cover gate in `lib/supabase/queries.ts` re-checks this on read.
 *
 * Throws on database errors. Not a Server Action: callers are authenticated actions
 * that pass the admin client.
 */
export async function syncCoverPhoto(supabase: AdminClient, cafeId: string): Promise<void> {
  const [cafeRes, reviewsRes, photosRes] = await Promise.all([
    supabase.from("cafes").select("cover_photo_url").eq("id", cafeId).single(),
    supabase
      .from("reviews")
      .select("id, date_visited, created_at, cover_photo_id")
      .eq("cafe_id", cafeId)
      .eq("status", "published"),
    supabase
      .from("photos")
      .select("id, review_id, photo_url, created_at")
      .eq("cafe_id", cafeId)
      .order("created_at", { ascending: true }),
  ]);
  // Fail loudly: a failed read must not leave a stale (possibly draft) cover public.
  const readError = cafeRes.error ?? reviewsRes.error ?? photosRes.error;
  if (readError) throw new Error(`syncCoverPhoto: ${readError.message}`);
  if (!cafeRes.data) return;

  const current = cafeRes.data.cover_photo_url;
  const next = pickCafeCover(reviewsRes.data ?? [], photosRes.data ?? []);
  if (next === current) return;

  // Compare-and-set: only replace the cover we read, so two syncs racing don't
  // overwrite each other with a stale pick.
  const update = supabase.from("cafes").update({ cover_photo_url: next }).eq("id", cafeId);
  const { error } = await (current === null
    ? update.is("cover_photo_url", null)
    : update.eq("cover_photo_url", current));
  if (error) throw new Error(`syncCoverPhoto: ${error.message}`);
}
