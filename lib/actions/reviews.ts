"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireAuth } from "@/lib/auth";
import { syncCoverPhoto } from "@/lib/cover-photo";
import { toStoragePath } from "@/lib/storage";
import { recalculateCafeRating } from "@/lib/ratings";
import { canPublish, normalizeScore } from "@/lib/review-rules";

export type DraftItem = {
  name: string;
  category: "drink" | "food";
  type: string | null;
  rating: number | null;
  is_favorite: boolean;
  notes: string | null;
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Trimmed text, or null when empty. */
function optionalText(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

/** A score from the client: null, or a whole number 1–5. Anything else is an error. */
function scoreOrError(value: number | null, what: string): { score: number | null; error: string | null } {
  if (value === null) return { score: null, error: null };
  const score = normalizeScore(value);
  return score === null
    ? { score: null, error: `${what} must be a whole number from 1 to 5.` }
    : { score, error: null };
}

/**
 * Save a new visit as a **draft**, with its drinks. Always a draft: publishing is a
 * separate step (`publishReview`) that checks every score is in. The author is whoever
 * is signed in. Returns the new item ids in input order, so photos can be linked to them.
 */
export async function createReviewDraft(input: {
  cafe_id: string;
  date_visited: string;
  overall_rating: number | null;
  verdict: string | null;
  note: string | null;
  items: DraftItem[];
}): Promise<{ error: string | null; reviewId?: string; itemIds?: string[] }> {
  const user = await requireAuth();
  const supabase = createAdminClient();

  if (!DATE_RE.test(input.date_visited)) return { error: "Pick the date of the visit." };
  const overall = scoreOrError(input.overall_rating, "The overall score");
  if (overall.error) return { error: overall.error };

  const items: DraftItem[] = [];
  for (const item of input.items) {
    const name = item.name.trim();
    if (!name) continue; // an empty drink row in the form
    if (item.category !== "drink" && item.category !== "food") return { error: `Unknown category for ${name}.` };
    const rating = scoreOrError(item.rating, `The score for ${name}`);
    if (rating.error) return { error: rating.error };
    items.push({ ...item, name, type: optionalText(item.type), rating: rating.score, notes: optionalText(item.notes) });
  }

  const { data: cafe, error: cafeError } = await supabase
    .from("cafes")
    .select("id")
    .eq("id", input.cafe_id)
    .maybeSingle();
  if (cafeError) return { error: cafeError.message };
  if (!cafe) return { error: "That cafe doesn't exist anymore. Pick it again." };

  const { data: review, error } = await supabase
    .from("reviews")
    .insert({
      cafe_id: input.cafe_id,
      author_id: user.id,
      date_visited: input.date_visited,
      overall_rating: overall.score,
      verdict: optionalText(input.verdict),
      note: optionalText(input.note),
      status: "draft",
    })
    .select("id")
    .single();
  if (error || !review) return { error: error?.message ?? "Couldn't save the draft." };

  if (items.length === 0) return { error: null, reviewId: review.id, itemIds: [] };

  const { data: inserted, error: itemsError } = await supabase
    .from("items")
    .insert(
      items.map((item) => ({
        cafe_id: input.cafe_id,
        review_id: review.id,
        name: item.name,
        category: item.category,
        type: item.type,
        rating: item.rating,
        is_favorite: item.is_favorite,
        notes: item.notes,
        photo_url: null,
      })),
    )
    .select("id");
  if (itemsError || !inserted) {
    // Don't leave a half-saved draft behind: the form will be submitted again.
    await supabase.from("reviews").delete().eq("id", review.id);
    return { error: `Couldn't save the drinks: ${itemsError?.message ?? "unknown error"}` };
  }

  // A multi-row insert returns rows in input order.
  return { error: null, reviewId: review.id, itemIds: inserted.map((row) => row.id) };
}

/** Load a review's score and its items' scores, then run the publish rules. */
async function checkPublishable(
  supabase: ReturnType<typeof createAdminClient>,
  reviewId: string,
  overrideOverall?: number | null,
): Promise<string | null> {
  const [reviewRes, itemsRes] = await Promise.all([
    supabase.from("reviews").select("overall_rating").eq("id", reviewId).single(),
    supabase.from("items").select("name, rating").eq("review_id", reviewId),
  ]);
  if (reviewRes.error || !reviewRes.data) return reviewRes.error?.message ?? "Review not found.";
  if (itemsRes.error) return itemsRes.error.message;
  const overall = overrideOverall === undefined ? reviewRes.data.overall_rating : overrideOverall;
  const check = canPublish({ overall_rating: overall }, itemsRes.data ?? []);
  return check.ok ? null : check.reason;
}

/**
 * Legacy create used by the quick-add and review/new pages until the capture form replaces
 * them. Publishing straight away goes through the same publish rules as `publishReview`.
 */
export async function createReview(data: {
  cafe_id: string;
  overall_rating: number;
  note: string;
  date_visited: string;
  status: "draft" | "published";
  items?: Array<{
    name: string;
    category: "drink" | "food";
    type: string;
    rating: number;
    is_favorite: boolean;
    notes?: string;
  }>;
  photo_urls?: string[];
}) {
  const user = await requireAuth();
  const supabase = createAdminClient();

  // Explicit status, never the column default ('published'): a missing or unknown value
  // from the client saves a draft.
  const status = data.status === "published" ? "published" : "draft";
  if (status === "published") {
    const check = canPublish({ overall_rating: data.overall_rating }, data.items ?? []);
    if (!check.ok) return { error: check.reason, review: null };
  }

  // Insert review, attributed to whoever is signed in (byline, ship-plan R7)
  const { data: review, error } = await supabase
    .from("reviews")
    .insert({
      cafe_id: data.cafe_id,
      author_id: user.id,
      overall_rating: data.overall_rating,
      note: data.note,
      date_visited: data.date_visited,
      status,
    })
    .select()
    .single();

  if (error || !review) return { error: error?.message ?? "Failed to create review", review: null };

  // Insert items
  if (data.items && data.items.length > 0) {
    const { error: itemsError } = await supabase.from("items").insert(
      data.items.map((item) => ({
        cafe_id: data.cafe_id,
        review_id: review.id,
        name: item.name,
        category: item.category,
        type: item.type,
        rating: item.rating,
        is_favorite: item.is_favorite,
        notes: item.notes ?? null,
        photo_url: null,
      }))
    );
    if (itemsError) {
      return { error: `Failed to save items: ${itemsError.message}`, review };
    }
  }

  // Link photos. Store bare storage paths; anything that isn't a photos-bucket path is dropped.
  const photoPaths = (data.photo_urls ?? [])
    .map((value) => toStoragePath(value))
    .filter((path): path is string => path !== null);
  if (photoPaths.length > 0) {
    await supabase.from("photos").insert(
      photoPaths.map((path) => ({
        cafe_id: data.cafe_id,
        review_id: review.id,
        photo_url: path,
      }))
    );
  }

  // Cover comes only from published-review photos (a draft's photos stay off the public cafe row)
  await syncCoverPhoto(supabase, data.cafe_id);

  // Recalculate rating if published
  if (status === "published") {
    await recalculateCafeRating(supabase, data.cafe_id);
  }

  return { error: null, review };
}

export async function updateReview(
  reviewId: string,
  data: {
    overall_rating?: number | null;
    note?: string | null;
    verdict?: string | null;
    date_visited?: string;
    status?: "draft" | "published";
  }
) {
  await requireAuth();
  const supabase = createAdminClient();

  // Whitelist the editable fields. author_id is deliberately not editable here:
  // an edit never changes or claims a review's author (unattributed reviews stay
  // unattributed, so one author can't be credited with the other's review).
  const { overall_rating, note, verdict, date_visited, status } = data;
  if (overall_rating !== undefined) {
    const overall = scoreOrError(overall_rating, "The overall score");
    if (overall.error) return { error: overall.error };
  }

  // Every path to "published" runs the publish rules (an edit can also change the score
  // of an already published review, which must stay scored).
  const { data: existing, error: readError } = await supabase
    .from("reviews")
    .select("cafe_id, status")
    .eq("id", reviewId)
    .single();
  if (readError || !existing) return { error: readError?.message ?? "Review not found." };
  if ((status ?? existing.status) === "published") {
    const reason = await checkPublishable(supabase, reviewId, overall_rating);
    if (reason) return { error: reason };
  }

  const { error } = await supabase
    .from("reviews")
    .update({
      overall_rating,
      note: note === undefined ? undefined : optionalText(note),
      verdict: verdict === undefined ? undefined : optionalText(verdict),
      date_visited,
      status,
    })
    .eq("id", reviewId);

  if (error) return { error: error.message };

  // Always recalculate: covers publish, unpublish, and rating changes.
  await recalculateCafeRating(supabase, existing.cafe_id);
  // Publishing or unpublishing moves the cafe cover to the latest published visit.
  await syncCoverPhoto(supabase, existing.cafe_id);

  return { error: null };
}

/** Publish a draft: every score must be in (see `canPublish`). */
export async function publishReview(reviewId: string) {
  return updateReview(reviewId, { status: "published" });
}

/** Choose this visit's hero photo. The photo must belong to this review. */
export async function setReviewCover(reviewId: string, photoId: string): Promise<{ error: string | null }> {
  await requireAuth();
  const supabase = createAdminClient();

  const { data: photo, error: photoError } = await supabase
    .from("photos")
    .select("review_id, cafe_id")
    .eq("id", photoId)
    .maybeSingle();
  if (photoError) return { error: photoError.message };
  if (!photo || photo.review_id !== reviewId) return { error: "That photo isn't part of this review." };

  const { error } = await supabase.from("reviews").update({ cover_photo_id: photoId }).eq("id", reviewId);
  if (error) return { error: error.message };

  await syncCoverPhoto(supabase, photo.cafe_id);
  return { error: null };
}
