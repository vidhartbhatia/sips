// Frontmatter → PostMeta. Plain module (no `server-only`), so unit tests can import it.

export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export interface PostMeta {
  slug: string;
  title: string;
  date: string;
  author?: string;
  excerpt?: string;
  cover?: string;
  /** Slugs of the cafes this story mentions, from frontmatter `cafes:`. Feeds "Featured in". */
  cafes: string[];
}

const optionalString = (v: unknown): string | undefined =>
  typeof v === "string" && v.trim() !== "" ? v : undefined;

/** A YAML list of cafe slugs. Entries that aren't valid slugs are dropped; anything else is []. */
const cafeSlugs = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((s): s is string => typeof s === "string" && SLUG_RE.test(s)) : [];

/**
 * Single source of truth for frontmatter → PostMeta. Returns null for drafts and for
 * invalid posts. Anything other than literal YAML `draft: false` (or no `draft` key)
 * counts as a draft, so a typo never publishes by accident.
 */
export function toMeta(slug: string, fm: Record<string, unknown>): PostMeta | null {
  if ("draft" in fm && fm.draft !== false) return null;
  const title = optionalString(fm.title);
  const rawDate = fm.date instanceof Date ? fm.date.toISOString().slice(0, 10) : fm.date;
  const date = optionalString(rawDate);
  if (!title || !date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  return {
    slug,
    title,
    date,
    author: optionalString(fm.author),
    excerpt: optionalString(fm.excerpt),
    cover: optionalString(fm.cover),
    cafes: cafeSlugs(fm.cafes),
  };
}
