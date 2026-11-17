"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireAuth } from "@/lib/auth";
import type { DraftItem } from "@/lib/actions/reviews";
import { itemChangeAllowed, validateDraftItem } from "@/lib/item-rules";

// Editing a visit's drinks (or food) one row at a time. The cafe and the review's status
// always come from the review row, never from the client. Drink scores don't feed the cafe
// rating (that's the mean of visit scores), so no recalculation is needed here.

/** Add a drink to a review. A published review only takes scored drinks. */
export async function addReviewItem(
  reviewId: string,
  item: DraftItem,
): Promise<{ error: string | null; itemId?: string }> {
  await requireAuth();
  const check = validateDraftItem(item);
  if (!check.ok) return { error: check.reason };

  const supabase = createAdminClient();
  const { data: review, error: reviewError } = await supabase
    .from("reviews")
    .select("cafe_id, status")
    .eq("id", reviewId)
    .maybeSingle();
  if (reviewError) return { error: reviewError.message };
  if (!review) return { error: "Review not found." };

  const allowed = itemChangeAllowed(review.status, check.item.rating);
  if (!allowed.ok) return { error: allowed.reason };

  const { data: row, error } = await supabase
    .from("items")
    .insert({ ...check.item, cafe_id: review.cafe_id, review_id: reviewId, photo_url: null })
    .select("id")
    .single();
  if (error || !row) return { error: error?.message ?? "Couldn't save the drink." };
  return { error: null, itemId: row.id };
}

/** Change a drink's name, category, type, score, favourite or note. Never moves it. */
export async function updateReviewItem(itemId: string, item: DraftItem): Promise<{ error: string | null }> {
  await requireAuth();
  const check = validateDraftItem(item);
  if (!check.ok) return { error: check.reason };

  const supabase = createAdminClient();
  const { data: existing, error: itemError } = await supabase
    .from("items")
    .select("review_id")
    .eq("id", itemId)
    .maybeSingle();
  if (itemError) return { error: itemError.message };
  if (!existing) return { error: "That drink doesn't exist anymore. Reload the page." };
  if (!existing.review_id) return { error: "That drink isn't part of a review." };

  const { data: review, error: reviewError } = await supabase
    .from("reviews")
    .select("status")
    .eq("id", existing.review_id)
    .maybeSingle();
  if (reviewError) return { error: reviewError.message };
  if (!review) return { error: "Review not found." };

  const allowed = itemChangeAllowed(review.status, check.item.rating);
  if (!allowed.ok) return { error: allowed.reason };

  const { name, category, type, rating, is_favorite, notes } = check.item;
  const { error } = await supabase
    .from("items")
    .update({ name, category, type, rating, is_favorite, notes })
    .eq("id", itemId);
  return { error: error?.message ?? null };
}

/**
 * Remove a drink. Photos of it keep their row: the foreign key sets `photos.item_id` to null
 * (migration 008). No publish check: removing a drink can't leave one unscored.
 */
export async function deleteReviewItem(itemId: string): Promise<{ error: string | null }> {
  await requireAuth();
  const supabase = createAdminClient();
  const { error } = await supabase.from("items").delete().eq("id", itemId);
  return { error: error?.message ?? null };
}
