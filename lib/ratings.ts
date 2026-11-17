import type { createAdminClient } from "@/lib/supabase/admin";

// Plain module on purpose: no "use server". Exporting from a "use server" file would turn
// these into public Server Action endpoints. See docs/gotchas.md (duplicated rating logic).

/** Average of review ratings rounded to the nearest 0.5. Zero reviews → `null`, never `0`. */
export function averageRating(ratings: readonly number[]): number | null {
  if (ratings.length === 0) return null;
  const avg = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
  return Math.round(avg * 2) / 2;
}

/** Recompute a cafe's `overall_rating` from its published reviews. */
export async function recalculateCafeRating(
  supabase: ReturnType<typeof createAdminClient>,
  cafeId: string,
): Promise<void> {
  const { data: reviews } = await supabase
    .from("reviews")
    .select("overall_rating")
    .eq("cafe_id", cafeId)
    .eq("status", "published");

  await supabase
    .from("cafes")
    .update({ overall_rating: averageRating((reviews ?? []).map((r) => r.overall_rating)) })
    .eq("id", cafeId);
}
