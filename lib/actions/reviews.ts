"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireAuth } from "@/lib/auth";
import { syncCoverPhoto } from "@/lib/cover-photo";
import { toStoragePath } from "@/lib/storage";

async function recalculateRating(supabase: ReturnType<typeof createAdminClient>, cafeId: string) {
  const { data: reviews } = await supabase
    .from("reviews")
    .select("overall_rating")
    .eq("cafe_id", cafeId)
    .eq("status", "published");

  if (!reviews || reviews.length === 0) {
    await supabase
      .from("cafes")
      .update({ overall_rating: null })
      .eq("id", cafeId);
    return;
  }

  const avg = reviews.reduce((sum, r) => sum + r.overall_rating, 0) / reviews.length;
  const rounded = Math.round(avg * 2) / 2; // Round to nearest 0.5

  await supabase
    .from("cafes")
    .update({ overall_rating: rounded })
    .eq("id", cafeId);
}

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

  // Insert review, attributed to whoever is signed in (byline, ship-plan R7)
  const { data: review, error } = await supabase
    .from("reviews")
    .insert({
      cafe_id: data.cafe_id,
      author_id: user.id,
      overall_rating: data.overall_rating,
      note: data.note,
      date_visited: data.date_visited,
      status: data.status,
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
  if (data.status === "published") {
    await recalculateRating(supabase, data.cafe_id);
  }

  return { error: null, review };
}

export async function updateReview(
  reviewId: string,
  data: {
    overall_rating?: number;
    note?: string;
    date_visited?: string;
    status?: "draft" | "published";
  }
) {
  await requireAuth();
  const supabase = createAdminClient();

  // Whitelist the editable fields. author_id is deliberately not editable here:
  // an edit never changes or claims a review's author (unattributed reviews stay
  // unattributed, so one author can't be credited with the other's review).
  const { overall_rating, note, date_visited, status } = data;
  const { error } = await supabase
    .from("reviews")
    .update({ overall_rating, note, date_visited, status })
    .eq("id", reviewId);

  if (error) return { error: error.message };

  // Always recalculate — covers publish, unpublish, and rating changes
  {
    const { data: review } = await supabase
      .from("reviews")
      .select("cafe_id")
      .eq("id", reviewId)
      .single();

    if (review) {
      await recalculateRating(supabase, review.cafe_id);
      // Unpublishing must take this review's photo off the public cafe cover
      await syncCoverPhoto(supabase, review.cafe_id);
    }
  }

  return { error: null };
}

export async function publishReview(reviewId: string) {
  return updateReview(reviewId, { status: "published" });
}
