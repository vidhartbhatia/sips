export type UploadResult = { photoId?: string; error: string | null };

export type QueueResult = {
  /** Ids of the photos that uploaded, in the order given. */
  photoIds: string[];
  /** Files that couldn't be resized or uploaded, with a message for the author. */
  failures: { name: string; error: string }[];
};

/**
 * Upload photos one at a time: resize each file, then send it in its own request.
 *
 * One photo per request keeps every request well under the hosting body limit (a phone
 * photo is 3–8 MB before resizing). Sequential, so a slow connection never has several
 * large requests in flight. A failure is recorded and the queue moves on.
 */
export async function uploadQueue(
  files: readonly File[],
  upload: (file: Blob) => Promise<UploadResult>,
  resize: (file: File) => Promise<Blob>,
): Promise<QueueResult> {
  const photoIds: string[] = [];
  const failures: QueueResult["failures"] = [];

  for (const file of files) {
    try {
      const small = await resize(file);
      const result = await upload(small);
      if (result.error || !result.photoId) {
        failures.push({ name: file.name, error: result.error ?? "Upload failed." });
      } else {
        photoIds.push(result.photoId);
      }
    } catch (e) {
      failures.push({ name: file.name, error: e instanceof Error ? e.message : String(e) });
    }
  }

  return { photoIds, failures };
}
