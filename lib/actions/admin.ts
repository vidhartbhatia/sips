"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireAuth } from "@/lib/auth";
import { deletePhoto } from "@/lib/storage";
import { syncCoverPhoto } from "@/lib/cover-photo";
import { recalculateCafeRating } from "@/lib/ratings";
import { redirect } from "next/navigation";

export async function deleteCafe(cafeId: string) {
  await requireAuth();
  const supabase = createAdminClient();

  // Delete associated photos from storage
  const { data: photos } = await supabase
    .from("photos")
    .select("photo_url")
    .eq("cafe_id", cafeId);

  if (photos) {
    for (const photo of photos) {
      try { await deletePhoto(photo.photo_url); } catch {}
    }
  }

  // Delete cafe (cascades to reviews, items, photos via FK)
  const { error } = await supabase
    .from("cafes")
    .delete()
    .eq("id", cafeId);

  if (error) return { error: error.message };
  redirect("/admin/cafes");
}

export async function deleteReview(reviewId: string) {
  await requireAuth();
  const supabase = createAdminClient();

  // Get cafe_id for rating recalculation
  const { data: review } = await supabase
    .from("reviews")
    .select("cafe_id")
    .eq("id", reviewId)
    .single();

  // Delete associated photos from storage
  const { data: photos } = await supabase
    .from("photos")
    .select("photo_url")
    .eq("review_id", reviewId);

  if (photos) {
    for (const photo of photos) {
      try { await deletePhoto(photo.photo_url); } catch {}
    }
  }

  const { error } = await supabase
    .from("reviews")
    .delete()
    .eq("id", reviewId);

  if (error) return { error: error.message };

  // If the cover was one of this review's photos, re-pick it from published reviews
  if (review) {
    await syncCoverPhoto(supabase, review.cafe_id);
    await recalculateCafeRating(supabase, review.cafe_id);
  }

  redirect("/admin");
}
