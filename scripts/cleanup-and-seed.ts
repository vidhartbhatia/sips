/**
 * Data cleanup & seed script for Sips.
 *
 * 1. Removes placeholder cafes (not relevant to the site)
 * 2. Strips fake reviews/ratings from real visited cafes
 * 3. Promotes visited drafts to published
 * 4. Moves want-to-go places to the want_to_go table
 * 5. Inserts 3 detailed test cafes with realistic reviews + items
 *
 * Usage: npx tsx scripts/cleanup-and-seed.ts
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envFile = readFileSync(join(__dirname, "..", ".env.local"), "utf-8");
for (const line of envFile.split("\n")) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) process.env[match[1].trim()] = match[2].trim();
}

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

// ── Slugs to REMOVE (not relevant — wrong city, chain, etc.) ──
const REMOVE_SLUGS = [
  "starbucks-reserve-roastery",
  "plantiful-capitol-hill",
  "sharetea",
  "banter",
  "provisions",
  "spruce",
  "flatstick-pub-redmond",
];

// ── Slugs that are VISITED (keep published, strip fake reviews) ──
const VISITED_SLUGS = [
  "matcha-magic-capitol-hill",
  "bonito-caf-y-mercadito",
  "kemi-dessert-bar",
  "percys-co-seattle",
  "rumba",
  "belmont",
  "liberty",
  "espresso-vivace-capitol-hill", // was draft
  "open-form-cafe", // was draft
];

// ── Slugs to move to WANT TO GO (then delete from cafes) ──
const WANT_TO_GO_SLUGS = [
  "makeworth-coffee",
  "blank-space-cafe",
  "hi-spot-cafe",
  "cafe-soleil",
  "black-arrows-coffee",
  "cafe-aloe",
  "saunter-coffee",
  "honest-to-pete-coffee-roasters",
  "mr-west-coffee",
  "kafkas-coffee-roasting",
  "paper-fan-cocktail-bar",
  "rupee-bar",
  "bar-sabine",
  "some-random-bar",
];

// ── Detailed test cafes with realistic data ──
const TEST_CAFES = [
  {
    name: "Elm Coffee Roasters",
    slug: "elm-coffee-roasters",
    address: "240 2nd Ave Ext S, Seattle, WA 98104",
    lat: 47.5993,
    lng: -122.3316,
    neighborhood: "Pioneer Square",
    vibe_tags: ["minimalist", "spacious", "good wifi"],
    status: "published",
    reviews: [
      {
        date_visited: "2026-03-15",
        overall_rating: 4,
        note: "Stunning minimalist space — all concrete and light wood. The cortado was perfectly balanced with a silky texture. Got a window seat and worked for two hours without anyone bothering me. Only ding: the pastry selection was limited by afternoon. Would come back for the pour-over flight.",
      },
    ],
    items: [
      { name: "Cortado", category: "drink", type: "espresso", rating: 5, notes: "Silky, well-balanced. Their house blend shines here.", is_favorite: true },
      { name: "Pour Over — Ethiopia Yirgacheffe", category: "drink", type: "coffee", rating: 4, notes: "Bright and fruity, nice citrus finish." },
      { name: "Morning Bun", category: "food", type: "pastry", rating: 3, notes: "Decent but a bit dry by 2pm." },
    ],
  },
  {
    name: "Oat & Sage",
    slug: "oat-and-sage",
    address: "1847 E Madison St, Seattle, WA 98122",
    lat: 47.6165,
    lng: -122.3065,
    neighborhood: "Capitol Hill",
    vibe_tags: ["cozy", "matcha", "plant-filled"],
    status: "published",
    reviews: [
      {
        date_visited: "2026-03-22",
        overall_rating: 5,
        note: "This instantly became our favorite. The space feels like walking into someone's beautifully curated living room — trailing plants everywhere, mismatched vintage mugs, and a barista who actually asked what flavor profile we like before recommending. The ceremonial matcha latte was the best I've had in Seattle, and the lavender scone was still warm. We stayed for three hours and left planning our next visit.",
      },
    ],
    items: [
      { name: "Ceremonial Matcha Latte", category: "drink", type: "matcha", rating: 5, notes: "Rich, creamy, not bitter at all. Made with oat milk.", is_favorite: true },
      { name: "Lavender Honey Scone", category: "food", type: "pastry", rating: 5, notes: "Warm, flaky, perfectly sweet. Gone in 60 seconds.", is_favorite: true },
      { name: "Hojicha Latte", category: "drink", type: "tea", rating: 4, notes: "Toasty and smooth, could be a bit stronger." },
    ],
  },
  {
    name: "Bricks & Mortar Coffee",
    slug: "bricks-and-mortar-coffee",
    address: "5627 California Ave SW, Seattle, WA 98136",
    lat: 47.5566,
    lng: -122.3875,
    neighborhood: "West Seattle",
    vibe_tags: ["neighborhood", "dog-friendly", "bright"],
    status: "published",
    reviews: [
      {
        date_visited: "2026-02-28",
        overall_rating: 3,
        note: "Solid neighborhood spot but nothing that'd make me cross town for it. The drip coffee was fine, the vibes were chill, and there were about four dogs in the place which was honestly the highlight. The breakfast sandwich was surprisingly good though — crispy English muffin with a runny egg. Seating is limited so come early on weekends.",
      },
    ],
    items: [
      { name: "House Drip", category: "drink", type: "coffee", rating: 3, notes: "Does the job. Nothing memorable." },
      { name: "Oat Milk Latte", category: "drink", type: "espresso", rating: 3, notes: "A bit too hot, oat milk was scorched." },
      { name: "Breakfast Sandwich", category: "food", type: "sandwich", rating: 4, notes: "Surprisingly great — crispy muffin, runny egg, good cheese.", is_favorite: true },
    ],
  },
];

async function main() {
  console.log("🧹 Sips Data Cleanup & Seed\n");

  // ── Step 1: Remove placeholder cafes ──
  console.log("Step 1: Removing placeholder cafes...");
  for (const slug of REMOVE_SLUGS) {
    // Reviews/items/photos cascade on delete
    const { error } = await sb.from("cafes").delete().eq("slug", slug);
    if (error) {
      console.log(`  ✗ ${slug}: ${error.message}`);
    } else {
      console.log(`  🗑  ${slug}`);
    }
  }

  // ── Step 2: Strip fake reviews from visited cafes ──
  console.log("\nStep 2: Stripping fake reviews from visited cafes...");
  for (const slug of VISITED_SLUGS) {
    // Get cafe ID
    const { data: cafe } = await sb
      .from("cafes")
      .select("id, name, status")
      .eq("slug", slug)
      .single();

    if (!cafe) {
      console.log(`  ⊘ ${slug} (not found in DB)`);
      continue;
    }

    // Delete all reviews for this cafe (they're fake imports)
    const { error: revErr } = await sb
      .from("reviews")
      .delete()
      .eq("cafe_id", cafe.id);

    if (revErr) {
      console.log(`  ✗ Reviews for ${cafe.name}: ${revErr.message}`);
    }

    // The trigger will auto-null the overall_rating when reviews are deleted
    // But also explicitly ensure published + rating cleared
    const { error: cafeErr } = await sb
      .from("cafes")
      .update({ status: "published", overall_rating: null })
      .eq("id", cafe.id);

    if (cafeErr) {
      console.log(`  ✗ ${cafe.name}: ${cafeErr.message}`);
    } else {
      const wasPublished = cafe.status === "published";
      console.log(
        `  ✓ ${cafe.name}${wasPublished ? "" : " (promoted to published)"}`
      );
    }
  }

  // ── Step 3: Move want-to-go cafes ──
  console.log("\nStep 3: Moving cafes to want-to-go list...");
  for (const slug of WANT_TO_GO_SLUGS) {
    const { data: cafe } = await sb
      .from("cafes")
      .select("id, name, address, lat, lng")
      .eq("slug", slug)
      .single();

    if (!cafe) {
      console.log(`  ⊘ ${slug} (not found in DB)`);
      continue;
    }

    // Insert into want_to_go
    const { error: wantErr } = await sb.from("want_to_go").insert({
      name: cafe.name,
      address: cafe.address,
      lat: cafe.lat,
      lng: cafe.lng,
      source: "manual",
      notes: null,
      cafe_id: null,
    });

    if (wantErr) {
      // Might already exist
      console.log(`  ⚠ ${cafe.name}: ${wantErr.message}`);
    } else {
      console.log(`  📌 ${cafe.name} → want-to-go`);
    }

    // Delete from cafes (cascades reviews/items/photos)
    await sb.from("cafes").delete().eq("id", cafe.id);
  }

  // ── Step 4: Insert test cafes ──
  console.log("\nStep 4: Inserting detailed test cafes...");
  for (const tc of TEST_CAFES) {
    const { data: cafe, error: cafeErr } = await sb
      .from("cafes")
      .insert({
        name: tc.name,
        slug: tc.slug,
        address: tc.address,
        lat: tc.lat,
        lng: tc.lng,
        neighborhood: tc.neighborhood,
        vibe_tags: tc.vibe_tags,
        cover_photo_url: null,
        google_place_id: null,
        status: tc.status,
      })
      .select("id")
      .single();

    if (cafeErr) {
      if (cafeErr.code === "23505") {
        console.log(`  ⊘ ${tc.name} (already exists)`);
      } else {
        console.log(`  ✗ ${tc.name}: ${cafeErr.message}`);
      }
      continue;
    }

    console.log(`  ☕ ${tc.name} (${tc.neighborhood})`);

    // Insert reviews
    for (const rev of tc.reviews) {
      const { data: review, error: revErr } = await sb
        .from("reviews")
        .insert({
          cafe_id: cafe.id,
          author_id: null,
          date_visited: rev.date_visited,
          note: rev.note,
          overall_rating: rev.overall_rating,
          status: "published",
        })
        .select("id")
        .single();

      if (revErr) {
        console.log(`    ✗ Review: ${revErr.message}`);
      } else {
        console.log(`    📝 Review: ${rev.overall_rating} sips`);

        // Insert items linked to this review
        if (review && tc.items) {
          for (const item of tc.items) {
            const { error: itemErr } = await sb.from("items").insert({
              cafe_id: cafe.id,
              review_id: review.id,
              name: item.name,
              category: item.category,
              type: item.type,
              rating: item.rating,
              notes: item.notes ?? null,
              is_favorite: item.is_favorite ?? false,
            });

            if (itemErr) {
              console.log(`    ✗ Item ${item.name}: ${itemErr.message}`);
            }
          }
          console.log(`    🍵 ${tc.items.length} items added`);
        }
      }
    }
  }

  // ── Summary ──
  console.log("\n── Summary ──");
  const { count: cafeCount } = await sb
    .from("cafes")
    .select("*", { count: "exact", head: true });
  const { count: pubCount } = await sb
    .from("cafes")
    .select("*", { count: "exact", head: true })
    .eq("status", "published");
  const { count: reviewCount } = await sb
    .from("reviews")
    .select("*", { count: "exact", head: true });
  const { count: wantCount } = await sb
    .from("want_to_go")
    .select("*", { count: "exact", head: true });
  const { count: itemCount } = await sb
    .from("items")
    .select("*", { count: "exact", head: true });

  console.log(`  Total cafes: ${cafeCount} (${pubCount} published)`);
  console.log(`  Total reviews: ${reviewCount}`);
  console.log(`  Total items: ${itemCount}`);
  console.log(`  Want-to-go entries: ${wantCount}`);
  console.log("\n✓ Done!");
}

main().catch(console.error);
