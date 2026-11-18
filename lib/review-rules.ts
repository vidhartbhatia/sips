// Plain module on purpose: no "use server" (exports from a "use server" file become public
// Server Action endpoints). Shared by the review actions and the forms.

export type PublishCheck = { ok: true } | { ok: false; reason: string };

const isScore = (n: number) => Number.isInteger(n) && n >= 1 && n <= 5;

/** The cafe fields the publish rule reads. */
export interface CafeLocation {
  address: string | null;
  lat: number | null;
  lng: number | null;
}

/**
 * Whether a cafe has a real location. A cafe added by name only (or before the place search)
 * was stored with `address = ''` and `lat = lng = 0`.
 */
export function hasLocation(cafe: CafeLocation): boolean {
  if (!cafe.address?.trim()) return false;
  if (cafe.lat === null || cafe.lng === null) return false;
  return !(cafe.lat === 0 && cafe.lng === 0);
}

/**
 * Whether a draft can be published: an overall score, a score on every drink, and, when
 * `cafe` is given, a cafe with an address and coordinates. Drafts may leave any score empty;
 * publishing may not (the DB also requires the overall score: reviews_published_needs_rating,
 * migration 008).
 *
 * Callers pass `cafe` only for a draft going live, so a legacy cafe without an address never
 * blocks an edit to a review that's already published.
 */
export function canPublish(
  review: { overall_rating: number | null },
  items: readonly { rating: number | null; name?: string }[],
  cafe?: CafeLocation,
): PublishCheck {
  if (review.overall_rating === null) {
    return { ok: false, reason: "Add an overall score before publishing." };
  }
  if (!isScore(review.overall_rating)) {
    return { ok: false, reason: "The overall score must be a whole number from 1 to 5." };
  }
  const unscored = items.filter((item) => item.rating === null);
  if (unscored.length > 0) {
    const names = unscored.map((item) => item.name?.trim()).filter(Boolean);
    const which = names.length > 0 ? `: ${names.join(", ")}` : "";
    return { ok: false, reason: `Score every drink before publishing${which}.` };
  }
  if (items.some((item) => item.rating !== null && !isScore(item.rating))) {
    return { ok: false, reason: "Drink scores must be whole numbers from 1 to 5." };
  }
  if (cafe && !hasLocation(cafe)) {
    return { ok: false, reason: "Add the cafe's address before publishing." };
  }
  return { ok: true };
}

/** A score from a form: a whole number 1–5, or null for "not scored yet". */
export function normalizeScore(value: number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  return isScore(value) ? value : null;
}
