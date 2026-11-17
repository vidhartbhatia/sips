import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET = "photos";

/**
 * Upload a photo to storage. Returns the public URL.
 * Abstraction layer — swap to Cloudinary/Vercel Blob by changing this file only.
 */
export async function uploadPhoto(
  file: File,
  cafeSlug: string
): Promise<string> {
  const supabase = createAdminClient();
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `cafes/${cafeSlug}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Delete a photo from storage by its public URL.
 */
export async function deletePhoto(publicUrl: string): Promise<void> {
  const supabase = createAdminClient();
  // Extract the storage path from the full URL
  const storagePath = publicUrl.includes(BUCKET)
    ? publicUrl.split(`${BUCKET}/`)[1]
    : publicUrl;

  const { error } = await supabase.storage
    .from(BUCKET)
    .remove([storagePath]);

  if (error) throw new Error(`Delete failed: ${error.message}`);
}
