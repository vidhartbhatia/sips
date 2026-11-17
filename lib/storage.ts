import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Review photos. The bucket is private (migration 007): the database stores each photo's
 * object path (e.g. `cafes/<slug>/<uuid>.jpg`) in `photos.photo_url` and
 * `cafes.cover_photo_url`, and pages get short-lived signed URLs from this file.
 *
 * This file is the only place that knows where photos live. A move to Cloudflare R2 swaps
 * the bodies below and keeps the same exports.
 */
const BUCKET = "photos";

/** A public signed URL stays valid for 2 days. */
const PUBLIC_URL_TTL_S = 2 * 24 * 60 * 60;
/**
 * The same URL is handed out for a whole day (the cache key includes the day), so
 * `next/image` sees a stable `src` and its optimizer cache keeps hitting. Every URL a page
 * hands out therefore has at least 1 day left, which covers a tab left open.
 */
const REUSE_WINDOW_MS = 24 * 60 * 60 * 1000;
/** Admin pages sign fresh on every render, with a short life. */
const ADMIN_URL_TTL_S = 60 * 60;

/** Storage path → signed URL. Paths that couldn't be signed are absent. */
export type SignedUrls = Record<string, string>;

const OBJECT_URL_RE = /\/storage\/v1\/object\/(?:public|sign|authenticated)\/([^/?#]+)\/([^?#]+)/;

/**
 * Normalize a stored photo value to an object path in the photos bucket.
 *
 * Accepts a bare path (what the app stores now) or a full Supabase object URL for the photos
 * bucket (what it stored before migration 007). Anything else, including URLs of other
 * buckets or other hosts, returns null.
 */
export function toStoragePath(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) {
    const match = OBJECT_URL_RE.exec(trimmed);
    if (!match || match[1] !== BUCKET) return null;
    try {
      return safePath(decodeURIComponent(match[2]));
    } catch {
      return null; // malformed percent-encoding
    }
  }
  return safePath(trimmed.replace(/^\/+/, ""));
}

function safePath(path: string): string | null {
  if (!path || path.split("/").some((seg) => seg === "" || seg === "." || seg === "..")) {
    return null;
  }
  return path;
}

/** Turn a `createSignedUrls` response into a path → URL map, skipping failed items. */
export function collectSignedUrls(
  rows: ReadonlyArray<{ path: string | null; signedUrl: string | null; error: string | null }>
): SignedUrls {
  const urls: SignedUrls = {};
  for (const row of rows) {
    if (row.path && row.signedUrl && !row.error) urls[row.path] = row.signedUrl;
  }
  return urls;
}

/** The reuse window a timestamp falls in. Part of the cache key, so URLs rotate daily. */
export function reuseWindow(nowMs: number): number {
  return Math.floor(nowMs / REUSE_WINDOW_MS);
}

/** Sorted, de-duplicated photos-bucket paths from stored values. */
export function uniquePaths(values: ReadonlyArray<string | null | undefined>): string[] {
  const paths = new Set<string>();
  for (const value of values) {
    const path = toStoragePath(value);
    if (path) paths.add(path);
  }
  return [...paths].sort();
}

/** Look up a stored value's signed URL, or null when there is none. */
export function signedUrlFor(urls: SignedUrls, value: string | null | undefined): string | null {
  const path = toStoragePath(value);
  return path ? (urls[path] ?? null) : null;
}

/** One batched signing call. Throws on a whole-call failure, so the failure isn't cached. */
async function signPaths(paths: string[], expiresIn: number): Promise<SignedUrls> {
  if (paths.length === 0) return {};
  const { data, error } = await createAdminClient()
    .storage.from(BUCKET)
    .createSignedUrls(paths, expiresIn);
  if (error) throw new Error(`Signing photo URLs failed: ${error.message}`);
  return collectSignedUrls(data);
}

const signPathsCached = unstable_cache(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- the window is only part of the cache key
  async (paths: string[], _window: number) => signPaths(paths, PUBLIC_URL_TTL_S),
  ["photo-signed-urls-v1"]
);

/**
 * Signed URLs for photos shown on public pages.
 *
 * Only pass paths that an anon (RLS-filtered) read just returned: this signs with the
 * service-role client, so it will sign anything it is given. Never throws; on failure it
 * logs and returns no URLs, and the page renders without those photos.
 */
export async function signPublicPhotoUrls(
  values: ReadonlyArray<string | null | undefined>
): Promise<SignedUrls> {
  const paths = uniquePaths(values);
  if (paths.length === 0) return {};
  try {
    return await signPathsCached(paths, reuseWindow(Date.now()));
  } catch (e) {
    console.error("signPublicPhotoUrls:", e);
    return {};
  }
}

/** Signed URLs for the admin UI (drafts included). Fresh each render, not cached. */
export async function signAdminPhotoUrls(
  values: ReadonlyArray<string | null | undefined>
): Promise<SignedUrls> {
  try {
    return await signPaths(uniquePaths(values), ADMIN_URL_TTL_S);
  } catch (e) {
    console.error("signAdminPhotoUrls:", e);
    return {};
  }
}

/** Upload a photo. Returns its storage path, which is what the database stores. */
export async function uploadPhoto(file: File, cafeSlug: string): Promise<string> {
  const supabase = createAdminClient();
  const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const path = `cafes/${cafeSlug}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type });

  if (error) throw new Error(`Upload failed: ${error.message}`);
  return path;
}

/** Delete a photo by its stored value (a path, or a pre-007 public URL). */
export async function deletePhoto(value: string): Promise<void> {
  const path = toStoragePath(value);
  if (!path) return;

  const { error } = await createAdminClient().storage.from(BUCKET).remove([path]);
  if (error) throw new Error(`Delete failed: ${error.message}`);
}
