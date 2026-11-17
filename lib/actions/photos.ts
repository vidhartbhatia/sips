"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { uploadPhoto as storageUpload, deletePhoto as storageDelete } from "@/lib/storage";
import { requireAuth } from "@/lib/auth";
import { syncCoverPhoto } from "@/lib/cover-photo";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/heic"]);
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

/** Shared upload checks. A failure message is shown to the author as-is. */
function checkImage(file: FormDataEntryValue | null): string | null {
  if (!(file instanceof File)) return "Choose a photo to upload.";
  if (!ALLOWED_TYPES.has(file.type)) return "Only JPEG, PNG, WebP, and HEIC images are allowed";
  if (file.size > MAX_SIZE) return "File must be under 10 MB";
  return null;
}

/**
 * Add one photo to a review (one file per request, so each request stays small).
 * The cafe comes from the review, never from the client. `itemId` links the photo to one
 * of this review's drinks.
 */
export async function addReviewPhoto(
  reviewId: string,
  formData: FormData,
  opts: { itemId?: string } = {}
): Promise<{ error: string | null; photoId?: string }> {
  await requireAuth();
  const supabase = createAdminClient();

  const file = formData.get("file");
  const invalid = checkImage(file);
  if (invalid) return { error: invalid };

  const { data: review, error: reviewError } = await supabase
    .from("reviews")
    .select("id, cafe_id, status, cafes(slug)")
    .eq("id", reviewId)
    .maybeSingle();
  if (reviewError) return { error: reviewError.message };
  if (!review || !review.cafes) return { error: "Review not found." };

  if (opts.itemId) {
    const { data: item, error: itemError } = await supabase
      .from("items")
      .select("review_id")
      .eq("id", opts.itemId)
      .maybeSingle();
    if (itemError) return { error: itemError.message };
    if (!item || item.review_id !== reviewId) return { error: "That drink isn't part of this review." };
  }

  let path: string;
  try {
    path = await storageUpload(file as File, review.cafes.slug);
  } catch (e) {
    return { error: (e as Error).message };
  }

  const { data: photo, error } = await supabase
    .from("photos")
    .insert({ cafe_id: review.cafe_id, review_id: reviewId, item_id: opts.itemId ?? null, photo_url: path })
    .select("id")
    .single();
  if (error || !photo) {
    // No row points at the object, so remove it rather than leave an orphan in the bucket.
    try {
      await storageDelete(path);
    } catch {
      // Best effort: the row insert error is the one worth reporting.
    }
    return { error: error?.message ?? "Couldn't save the photo." };
  }

  // A published visit may now have its first photo, which can become the cafe cover.
  if (review.status === "published") await syncCoverPhoto(supabase, review.cafe_id);

  return { error: null, photoId: photo.id };
}

export async function deletePhotoAction(photoId: string) {
  await requireAuth();
  const supabase = createAdminClient();

  // Get the photo path first
  const { data: photo } = await supabase
    .from("photos")
    .select("photo_url, cafe_id")
    .eq("id", photoId)
    .single();

  if (!photo) return { error: "Photo not found" };

  // Delete from storage
  try {
    await storageDelete(photo.photo_url);
  } catch {
    // Storage delete failed — still remove DB record
  }

  // Delete DB record
  const { error } = await supabase
    .from("photos")
    .delete()
    .eq("id", photoId);

  if (!error) {
    await syncCoverPhoto(supabase, photo.cafe_id);
  }

  return { error: error?.message ?? null };
}
