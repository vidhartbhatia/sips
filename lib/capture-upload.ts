import { uploadQueue, type UploadResult } from "@/lib/upload-queue";

export type PendingPhoto = {
  file: File;
  /** The drink or food item this photo shows. */
  itemId?: string;
  /** The photo the author picked as the visit's cover (the first general photo). */
  isCover?: boolean;
};

export type FailedPhoto = PendingPhoto & { error: string };

export interface VisitPhotoDeps {
  resize: (file: File) => Promise<Blob>;
  /** Upload one resized photo to the visit (one request). */
  addPhoto: (blob: Blob, itemId?: string) => Promise<UploadResult>;
  setCover: (photoId: string) => Promise<{ error: string | null }>;
  onProgress?: (done: number, total: number) => void;
}

/**
 * Upload a visit's photos one per request, then make the photo marked `isCover` the cover.
 *
 * The cover is the photo the author chose, not whichever uploaded first: if it fails, no
 * stand-in is set, and a later retry that uploads it sets it then. A cover failure is
 * reported separately and never loses the list of photos to retry.
 */
export async function uploadVisitPhotos(
  pending: readonly PendingPhoto[],
  deps: VisitPhotoDeps,
): Promise<{ failed: FailedPhoto[]; coverError: string | null }> {
  const failed: FailedPhoto[] = [];
  let coverId: string | null = null;

  for (const [i, photo] of pending.entries()) {
    deps.onProgress?.(i + 1, pending.length);
    const result = await uploadQueue([photo.file], (blob) => deps.addPhoto(blob, photo.itemId), deps.resize);
    const photoId = result.photoIds[0];
    if (!photoId) {
      failed.push({ ...photo, error: result.failures[0]?.error ?? "Upload failed." });
      continue;
    }
    if (photo.isCover) coverId = photoId;
  }

  let coverError: string | null = null;
  if (coverId) {
    try {
      coverError = (await deps.setCover(coverId)).error;
    } catch (e) {
      coverError = e instanceof Error ? e.message : String(e);
    }
  }
  return { failed, coverError };
}
