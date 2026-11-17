// Plain module on purpose: no "use server" (exports from a "use server" file become public
// Server Action endpoints). Shared by the review actions and the forms.

export type PublishCheck = { ok: true } | { ok: false; reason: string };

const isScore = (n: number) => Number.isInteger(n) && n >= 1 && n <= 5;

/**
 * Whether a draft can be published: an overall score, and a score on every drink.
 * Drafts may leave any score empty; publishing may not (the DB also requires the
 * overall score: reviews_published_needs_rating, migration 008).
 */
export function canPublish(
  review: { overall_rating: number | null },
  items: readonly { rating: number | null; name?: string }[],
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
  return { ok: true };
}

/** A score from a form: a whole number 1–5, or null for "not scored yet". */
export function normalizeScore(value: number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  return isScore(value) ? value : null;
}
