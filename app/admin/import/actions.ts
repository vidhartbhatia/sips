"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireAuth } from "@/lib/auth";
import type { ImportRow } from "@/lib/google/takeout-parser";

export type ImportResult = {
  cafesCreated: number;
  cafesSkipped: number;
  reviewsCreated: number;
  wantToGoCreated: number;
  errors: string[];
};

export async function importRows(rows: ImportRow[]): Promise<ImportResult> {
  await requireAuth();
  const supabase = createAdminClient();
  const result: ImportResult = {
    cafesCreated: 0,
    cafesSkipped: 0,
    reviewsCreated: 0,
    wantToGoCreated: 0,
    errors: [],
  };

  // Track slugs we've already inserted in this batch to avoid duplicates
  const insertedSlugs = new Set<string>();

  // First pass: fetch existing cafe slugs from DB
  const { data: existingCafes } = await supabase
    .from("cafes")
    .select("slug, id");
  const slugToId = new Map<string, string>();
  for (const cafe of existingCafes ?? []) {
    slugToId.set(cafe.slug, cafe.id);
  }

  for (const row of rows) {
    try {
      if (row.source === "saved-list") {
        // Insert want-to-go entry
        const { error } = await supabase.from("want_to_go").insert({
          name: row.wantToGo.name,
          address: row.wantToGo.address,
          lat: row.wantToGo.lat,
          lng: row.wantToGo.lng,
          source: row.wantToGo.source,
          notes: row.wantToGo.notes,
          cafe_id: null,
        });
        if (error) {
          result.errors.push(`Want-to-go "${row.wantToGo.name}": ${error.message}`);
        } else {
          result.wantToGoCreated++;
        }
        continue;
      }

      // Reviews or starred — need a cafe record first
      const slug = row.cafe.slug;

      if (!slugToId.has(slug) && !insertedSlugs.has(slug)) {
        // Insert new cafe
        const { data: newCafe, error: cafeError } = await supabase
          .from("cafes")
          .insert({
            name: row.cafe.name,
            slug,
            address: row.cafe.address,
            lat: row.cafe.lat,
            lng: row.cafe.lng,
            neighborhood: row.cafe.neighborhood,
            vibe_tags: row.cafe.vibe_tags,
            cover_photo_url: null,
            google_place_id: null,
            status: "draft",
          })
          .select("id")
          .single();

        if (cafeError) {
          result.errors.push(`Cafe "${row.cafe.name}": ${cafeError.message}`);
          continue;
        }
        slugToId.set(slug, newCafe.id);
        insertedSlugs.add(slug);
        result.cafesCreated++;
      } else if (!insertedSlugs.has(slug)) {
        result.cafesSkipped++;
      }

      const cafeId = slugToId.get(slug);
      if (!cafeId) continue;

      // Insert review if this is a reviews row
      if (row.source === "reviews") {
        const { error: reviewError } = await supabase.from("reviews").insert({
          cafe_id: cafeId,
          author_id: null,
          date_visited: row.review.date_visited,
          note: row.review.note,
          overall_rating: row.review.overall_rating,
          status: "draft",
        });
        if (reviewError) {
          result.errors.push(`Review for "${row.cafe.name}": ${reviewError.message}`);
        } else {
          result.reviewsCreated++;
        }
      }
    } catch (err) {
      const name = row.source === "saved-list" ? row.wantToGo.name : row.cafe.name;
      result.errors.push(`${name}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return result;
}
