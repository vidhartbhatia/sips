/**
 * Auth redirect sanitization helpers.
 *
 * Defends `/auth/callback` against open-redirect phishing.
 *
 * Attack vectors blocked:
 *  - Protocol-relative URLs:   `?next=//evil.com`         → resolves to https://evil.com
 *  - Backslash variants:       `?next=/\evil.com`         → some browsers normalize to //evil.com
 *  - Absolute external URLs:   `?next=https://evil.com`   → off-site redirect
 *  - Triple-slash variants:    `?next=///evil.com`        → same family as //
 *  - Encoded slash bypasses:   `?next=/%2fevil.com`       → URL-decoded by browsers
 *  - Encoded backslash:        `?next=/%5cevil.com`       → decoded to /\evil.com
 *
 * Strategy: only accept relative paths that start with a single `/`, contain no
 * backslashes, and resolve to the same origin when normalized via the URL constructor.
 * Anything else falls back to `/admin` (the post-login default).
 */
export function safeNext(next: string | null, origin: string): string {
  const fallback = "/admin";
  if (!next) return fallback;

  try {
    if (
      !next.startsWith("/") ||
      next.startsWith("//") ||
      next.startsWith("/\\") ||
      next.includes("\\")
    ) {
      return fallback;
    }

    const url = new URL(next, origin);
    return url.origin === origin
      ? `${url.pathname}${url.search}${url.hash}`
      : fallback;
  } catch {
    return fallback;
  }
}
