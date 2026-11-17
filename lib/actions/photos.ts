"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { uploadPhoto as storageUpload, deletePhoto as storageDelete } from "@/lib/storage";
import { requireAuth } from "@/lib/auth";
import { syncCoverPhoto } from "@/lib/cover-photo";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/heic"]);
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

export async function uploadPhotoAction(formData: FormData) {
  await requireAuth();

  const file = formData.get("file");
  const cafeSlug = formData.get("cafeSlug") as string;

  if (!(file instanceof File) || !cafeSlug) {
    return { error: "File and cafeSlug are required", path: null };
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return { error: "Only JPEG, PNG, WebP, and HEIC images are allowed", path: null };
  }

  if (file.size > MAX_SIZE) {
    return { error: "File must be under 10 MB", path: null };
  }

  try {
    // The storage path, not a URL: the bucket is private and pages sign URLs on read.
    const path = await storageUpload(file, cafeSlug);
    return { error: null, path };
  } catch (e) {
    return { error: (e as Error).message, path: null };
  }
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
    await syncCoverPhoto(supabase, photo.cafe_id, { removedUrls: [photo.photo_url] });
  }

  return { error: error?.message ?? null };
}
