// Plain module on purpose: no "use server" (exports from a "use server" file become public
// Server Action endpoints). Shared by the item actions and the edit form.

import type { DraftItem } from "@/lib/actions/reviews";
import { normalizeScore } from "@/lib/review-rules";

export type ItemCheck = { ok: true; item: DraftItem } | { ok: false; reason: string };

/** Trimmed text, or null when empty or not a string. */
function optionalText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

/**
 * Check and normalise one drink (or food) from the form. The name is required and trimmed,
 * the category is `drink` or `food`, a score is null or a whole number 1–5, and an empty
 * type or note becomes null. Input comes from the client, so nothing is assumed about its shape.
 */
export function validateDraftItem(item: DraftItem): ItemCheck {
  if (!item || typeof item !== "object") return { ok: false, reason: "Missing drink." };
  const name = typeof item.name === "string" ? item.name.trim() : "";
  if (!name) return { ok: false, reason: "Give the drink a name." };
  if (item.category !== "drink" && item.category !== "food") {
    return { ok: false, reason: `Unknown category for ${name}.` };
  }
  let rating: number | null = null;
  if (item.rating !== null && item.rating !== undefined) {
    rating = typeof item.rating === "number" ? normalizeScore(item.rating) : null;
    if (rating === null) return { ok: false, reason: `The score for ${name} must be a whole number from 1 to 5.` };
  }
  return {
    ok: true,
    item: {
      name,
      category: item.category,
      type: optionalText(item.type),
      rating,
      is_favorite: item.is_favorite === true,
      notes: optionalText(item.notes),
    },
  };
}

/** Whether a drink with this score may be saved on a review with this status. */
export function itemChangeAllowed(
  status: "draft" | "published",
  rating: number | null,
): { ok: true } | { ok: false; reason: string } {
  if (status === "published" && rating === null) {
    return { ok: false, reason: "This review is published, so every drink needs a score." };
  }
  return { ok: true };
}

/**
 * Whether a drink row in the edit form has changes to save. `saved` is what the server last
 * stored (null for a row that isn't saved yet). An unsaved row with no name isn't dirty: it
 * waits for a name. A saved row that no longer validates is dirty, so it isn't skipped.
 */
export function isDrinkDirty(current: DraftItem, saved: DraftItem | null): boolean {
  const check = validateDraftItem(current);
  if (!saved) return typeof current.name === "string" && current.name.trim() !== "";
  if (!check.ok) return true;
  const next = check.item;
  return (
    next.name !== saved.name ||
    next.category !== saved.category ||
    next.type !== saved.type ||
    next.rating !== saved.rating ||
    next.is_favorite !== saved.is_favorite ||
    next.notes !== saved.notes
  );
}
