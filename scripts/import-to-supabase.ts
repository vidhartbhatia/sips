/**
 * Import curated Seattle cafe data into Supabase.
 *
 * Usage: npx tsx scripts/import-to-supabase.ts
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env.local manually (no dotenv dependency)
const envFile = readFileSync(join(__dirname, "..", ".env.local"), "utf-8");
for (const line of envFile.split("\n")) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) process.env[match[1].trim()] = match[2].trim();
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ── Curated Seattle cafes & bars with data we're confident about ──

const CAFES = [
  // Reviewed cafes (have ratings + coordinates from Google)
  { name: "Makeworth Coffee", address: "6535 Phinney Ave N, Seattle, WA 98103", lat: 47.6757, lng: -122.3543, hood: "Phinney Ridge", rating: 5, review: "Really nice coffee shop to work in, lots of lovely light", tags: ["cozy", "good wifi", "bright"] },
  { name: "Matcha Magic Capitol Hill", address: "1225 E Madison St, Seattle, WA 98122", lat: 47.6165, lng: -122.3146, hood: "Capitol Hill", rating: 5, review: "New matcha place has lots of options and looks fun", tags: ["matcha", "modern"] },
  { name: "Blank Space Cafe", address: "12505 Bel-Red Rd, Bellevue, WA 98005", lat: 47.6212, lng: -122.1694, hood: "Bellevue", rating: 5, review: null, tags: ["modern", "spacious"] },
  { name: "Starbucks Reserve Roastery", address: "1124 Pike St, Seattle, WA 98101", lat: 47.6142, lng: -122.3283, hood: "Capitol Hill", rating: 5, review: null, tags: ["spacious", "modern", "loud"] },
  { name: "Plantiful Capitol Hill", address: "1426 11th Ave, Seattle, WA 98122", lat: 47.6148, lng: -122.3188, hood: "Capitol Hill", rating: 5, review: "Smoothies are yummy", tags: ["healthy", "bright"] },
  { name: "Sharetea", address: "511 Broadway E, Seattle, WA 98102", lat: 47.6237, lng: -122.3210, hood: "Capitol Hill", rating: 5, review: null, tags: ["boba"] },
  { name: "Bonito Café y Mercadito", address: "4100 Stone Way N, Seattle, WA 98103", lat: 47.6562, lng: -122.3425, hood: "Wallingford", rating: 5, review: null, tags: ["cozy"] },
  { name: "Banter", address: "1223 1st Ave, Seattle, WA 98101", lat: 47.6073, lng: -122.3402, hood: "Downtown", rating: 5, review: "Best avocado toast I've had in forever", tags: ["modern", "bright"] },
  { name: "Provisions", address: "300 E Pine St, Seattle, WA 98122", lat: 47.6154, lng: -122.3271, hood: "Capitol Hill", rating: 4, review: "Went for a food pop up, food was delicious and the live music was great", tags: ["cozy"] },
  { name: "Kemi Dessert Bar", address: "1205 E Pike St, Seattle, WA 98122", lat: 47.6145, lng: -122.3163, hood: "Capitol Hill", rating: 5, review: "They are really creative with their desserts and drinks", tags: ["dessert", "modern"] },

  // From saved lists (no rating, will be drafts)
  { name: "Espresso Vivace Capitol Hill", address: "532 Broadway E, Seattle, WA 98102", lat: 47.6240, lng: -122.3208, hood: "Capitol Hill", rating: null, review: null, tags: ["espresso"] },
  { name: "Hi-Spot Cafe", address: "1410 34th Ave, Seattle, WA 98122", lat: 47.6131, lng: -122.2917, hood: "Madrona", rating: null, review: null, tags: [] },
  { name: "Cafe Soleil", address: "1400 34th Ave, Seattle, WA 98122", lat: 47.6128, lng: -122.2917, hood: "Madrona", rating: null, review: null, tags: [] },
  { name: "Open Form Cafe", address: "619 Broadway E, Seattle, WA 98102", lat: 47.6249, lng: -122.3206, hood: "Capitol Hill", rating: null, review: null, tags: [] },
  { name: "Black Arrows Coffee", address: "5016 Rainier Ave S, Seattle, WA 98118", lat: 47.5610, lng: -122.2866, hood: "Columbia City", rating: null, review: null, tags: [] },
  { name: "Cafe Aloe", address: "12811 SE 38th St, Bellevue, WA 98006", lat: 47.5780, lng: -122.1617, hood: "Bellevue", rating: null, review: null, tags: [] },
  { name: "Saunter Coffee", address: "3815 S Othello St, Seattle, WA 98118", lat: 47.5388, lng: -122.2816, hood: "Othello", rating: null, review: null, tags: [] },
  { name: "Honest to Pete Coffee Roasters", address: "6510 Roosevelt Way NE, Seattle, WA 98115", lat: 47.6755, lng: -122.3178, hood: "Roosevelt", rating: null, review: null, tags: [] },
  { name: "Mr West Coffee", address: "4508 University Way NE, Seattle, WA 98105", lat: 47.6628, lng: -122.3135, hood: "University District", rating: null, review: null, tags: [] },
  { name: "Kafka's Coffee Roasting", address: "various locations, Seattle", lat: 47.6205, lng: -122.3493, hood: "Queen Anne", rating: null, review: null, tags: [] },
];

const BARS = [
  { name: "Percy's & Co. Seattle", address: "5765 Airport Way S, Seattle, WA 98108", lat: 47.5559, lng: -122.3205, hood: "Georgetown", rating: 5, review: "Amazing cocktails and ambiance", tags: ["cocktails"] },
  { name: "Rumba", address: "1112 Pike St, Seattle, WA 98101", lat: 47.6142, lng: -122.3286, hood: "Capitol Hill", rating: 5, review: "Best tiki drinks in Seattle!", tags: ["tiki", "cocktails"] },
  { name: "Belmont", address: "1419 E Pine St, Seattle, WA 98122", lat: 47.6153, lng: -122.3141, hood: "Capitol Hill", rating: 5, review: "Really like the ambience and their old fashioned variants", tags: ["cocktails", "cozy"] },
  { name: "Spruce", address: "1401 E Madison St, Seattle, WA 98122", lat: 47.6167, lng: -122.3132, hood: "Capitol Hill", rating: 5, review: "The spruce burger was really good, and the cocktails were pretty", tags: ["cocktails"] },
  { name: "Liberty", address: "517 15th Ave E, Seattle, WA 98112", lat: 47.6244, lng: -122.3126, hood: "Capitol Hill", rating: 4, review: null, tags: ["cocktails"] },
  { name: "Flatstick Pub - Redmond", address: "16180 NE 85th St, Redmond, WA 98052", lat: 47.6804, lng: -122.1207, hood: "Redmond", rating: 5, review: null, tags: ["pub", "games"] },
  { name: "Paper Fan Cocktail Bar", address: "1015 E Pike St, Seattle, WA 98122", lat: 47.6146, lng: -122.3189, hood: "Capitol Hill", rating: null, review: null, tags: ["cocktails"] },
  { name: "Rupee Bar", address: "1205 E Pike St, Seattle, WA 98122", lat: 47.6145, lng: -122.3163, hood: "Capitol Hill", rating: null, review: null, tags: ["cocktails", "indian"] },
  { name: "Bar Sabine", address: "803 E Roy St, Seattle, WA 98102", lat: 47.6254, lng: -122.3227, hood: "Capitol Hill", rating: null, review: null, tags: ["cocktails"] },
  { name: "Some Random Bar", address: "410 Olive Way, Seattle, WA 98101", lat: 47.6133, lng: -122.3373, hood: "Downtown", rating: null, review: null, tags: ["cocktails"] },
];

async function main() {
  console.log(`Importing ${CAFES.length} cafes and ${BARS.length} bars...\n`);

  let cafesCreated = 0;
  let reviewsCreated = 0;
  let errors: string[] = [];

  const allPlaces = [
    ...CAFES.map((c) => ({ ...c, type: "cafe" as const })),
    ...BARS.map((b) => ({ ...b, type: "bar" as const })),
  ];

  for (const place of allPlaces) {
    const slug = slugify(place.name);

    // Insert cafe
    const { data: cafe, error: cafeErr } = await supabase
      .from("cafes")
      .insert({
        name: place.name,
        slug,
        address: place.address,
        lat: place.lat,
        lng: place.lng,
        neighborhood: place.hood,
        vibe_tags: place.tags,
        cover_photo_url: null,
        google_place_id: null,
        status: place.rating ? "published" : "draft",
      })
      .select("id")
      .single();

    if (cafeErr) {
      // Might be duplicate slug
      if (cafeErr.code === "23505") {
        console.log(`  ⊘ ${place.name} (already exists)`);
      } else {
        errors.push(`${place.name}: ${cafeErr.message}`);
        console.log(`  ✗ ${place.name}: ${cafeErr.message}`);
      }
      continue;
    }

    cafesCreated++;
    const icon = place.type === "cafe" ? "☕" : "🍸";
    console.log(`  ${icon} ${place.name} (${place.hood})${place.rating ? " — " + place.rating + "★" : ""}`);

    // Insert review if we have a rating
    if (place.rating && cafe) {
      const { error: revErr } = await supabase.from("reviews").insert({
        cafe_id: cafe.id,
        author_id: null,
        date_visited: "2026-03-01", // approximate
        note: place.review ?? "",
        overall_rating: place.rating,
        status: "published",
      });

      if (revErr) {
        errors.push(`Review for ${place.name}: ${revErr.message}`);
      } else {
        reviewsCreated++;
      }
    }
  }

  console.log(`\n✓ Done!`);
  console.log(`  Cafes/bars created: ${cafesCreated}`);
  console.log(`  Reviews created: ${reviewsCreated}`);
  if (errors.length > 0) {
    console.log(`  Errors: ${errors.length}`);
    errors.forEach((e) => console.log(`    - ${e}`));
  }
}

main().catch(console.error);
