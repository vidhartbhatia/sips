/** Longest edge of an uploaded photo, in pixels. */
export const MAX_EDGE = 2000;
/** JPEG quality for re-encoded photos. */
const JPEG_QUALITY = 0.85;
/** A JPEG this small and within MAX_EDGE is uploaded as it is. */
const KEEP_AS_IS_BYTES = 2 * 1024 * 1024;
/**
 * When the browser can't resize a photo, it is sent unresized if it's at most this big.
 * Vercel rejects request bodies over 4.5 MB, so this leaves room for the form overhead.
 */
const ORIGINAL_MAX_BYTES = 4 * 1024 * 1024;
/** Formats every browser can show, so an unresized original is still usable on the site. */
const WEB_SAFE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

/** A decoded photo, ready to draw on a canvas. */
export interface Decoded {
  width: number;
  height: number;
  source: CanvasImageSource;
  release: () => void;
}

export type Decoder = (file: File) => Promise<Decoded>;

/**
 * Prepare a photo for upload in the browser: scale it so its longest edge is at most
 * `maxEdge` and re-encode it as JPEG (quality 0.85). A phone photo (3–8 MB, often HEIC)
 * comes out at a few hundred KB, so one photo per request stays far below the body limit.
 *
 * Decoding tries `createImageBitmap` first, then an <img>; mobile browsers sometimes fail
 * one but not the other on very large camera photos. If the browser can't resize the photo
 * at all, a web-safe original under 4 MB is uploaded as it is. Anything else (HEIC that
 * this browser can't read, a huge file, an empty cloud placeholder) rejects with a message
 * for the author instead of uploading something no page could show.
 */
export async function resizeImage(
  file: File,
  maxEdge: number = MAX_EDGE,
  decoders: readonly Decoder[] = [decodeWithBitmap, decodeWithImage]
): Promise<File> {
  if (file.size === 0) {
    throw new Error(
      `${file.name} is empty. If it's from Google Photos or iCloud, open it there first so it downloads, or take the photo with the camera.`
    );
  }

  try {
    const decoded = await decodeFirst(file, decoders);
    try {
      return await reencode(file, decoded, maxEdge);
    } finally {
      decoded.release();
    }
  } catch {
    if (WEB_SAFE_TYPES.has(file.type) && file.size <= ORIGINAL_MAX_BYTES) return file;
    throw new Error(
      `Couldn't read ${file.name} (${describeFile(file)}). If it's a HEIC photo, open this page in Safari or pick a JPEG.`
    );
  }
}

async function decodeFirst(file: File, decoders: readonly Decoder[]): Promise<Decoded> {
  let lastError: unknown = new Error("No decoder available.");
  for (const decode of decoders) {
    try {
      return await decode(file);
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError;
}

async function reencode(file: File, decoded: Decoded, maxEdge: number): Promise<File> {
  const scale = Math.min(1, maxEdge / Math.max(decoded.width, decoded.height));
  if (scale === 1 && file.type === "image/jpeg" && file.size <= KEEP_AS_IS_BYTES) return file;

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(decoded.width * scale);
  canvas.height = Math.round(decoded.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No 2D canvas.");
  ctx.drawImage(decoded.source, 0, 0, canvas.width, canvas.height);

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY));
  if (!blob) throw new Error("Canvas export failed.");

  const base = file.name.replace(/\.[^.]*$/, "") || "photo";
  return new File([blob], `${base}.jpg`, { type: "image/jpeg" });
}

function describeFile(file: File): string {
  const mb = (file.size / (1024 * 1024)).toFixed(1);
  return `${file.type || "unknown type"}, ${mb} MB`;
}

const decodeWithBitmap: Decoder = async (file) => {
  if (typeof createImageBitmap !== "function") throw new Error("createImageBitmap unsupported.");
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  return { width: bitmap.width, height: bitmap.height, source: bitmap, release: () => bitmap.close() };
};

const decodeWithImage: Decoder = (file) =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () =>
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
        source: img,
        release: () => URL.revokeObjectURL(url),
      });
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Image element couldn't decode the file."));
    };
    img.src = url;
  });
