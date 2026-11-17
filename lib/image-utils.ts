/** Longest edge of an uploaded photo, in pixels. */
export const MAX_EDGE = 2000;
/** JPEG quality for re-encoded photos. */
const JPEG_QUALITY = 0.85;
/** A JPEG this small and within MAX_EDGE is uploaded as it is. */
const KEEP_AS_IS_BYTES = 2 * 1024 * 1024;

/**
 * Prepare a photo for upload in the browser: scale it so its longest edge is at most
 * `maxEdge` and re-encode it as JPEG (quality 0.85). A phone photo (3–8 MB, often HEIC)
 * comes out at a few hundred KB, so one photo per request stays far below the body limit.
 *
 * HEIC is decoded by the browser itself (Safari on iPhone and Mac can; most others can't).
 * If the browser can't read the file, this rejects with a message for the author instead of
 * uploading something no page could show.
 */
export async function resizeImage(file: File, maxEdge: number = MAX_EDGE): Promise<File> {
  const img = await loadImage(file);
  const scale = Math.min(1, maxEdge / Math.max(img.naturalWidth, img.naturalHeight));

  if (scale === 1 && file.type === "image/jpeg" && file.size <= KEEP_AS_IS_BYTES) return file;

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.naturalWidth * scale);
  canvas.height = Math.round(img.naturalHeight * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("This browser couldn't process the photo.");
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY)
  );
  if (!blob) throw new Error("This browser couldn't process the photo.");

  const base = file.name.replace(/\.[^.]*$/, "") || "photo";
  return new File([blob], `${base}.jpg`, { type: "image/jpeg" });
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(
        new Error(
          `Couldn't read ${file.name}. If it's a HEIC photo, open this page in Safari or pick a JPEG.`
        )
      );
    };
    img.src = url;
  });
}
