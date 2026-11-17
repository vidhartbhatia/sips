/**
 * Curate Seattle data into cafe/coffee/matcha/bar-relevant entries.
 *
 * Usage: npx tsx scripts/curate-cafes.ts
 *
 * Reads from:  data/seattle-reviews.json
 *              data/seattle-saved-places.json
 *              data/seattle-lists.json
 *
 * Writes to:   data/curated-cafes.json   (ready for import)
 *              data/curated-summary.txt
 */

import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA = join(__dirname, "..", "data");

// Keywords that suggest a place is a cafe, coffee shop, tea house, matcha spot, or bar
const CAFE_KEYWORDS = [
  "coffee",
  "café",
  "cafe",
  "espresso",
  "roaster",
  "latte",
  "matcha",
  "tea ",
  "tea,",
  "boba",
  "bubble tea",
  "sharetea",
  "bakery",
  "pastry",
  "dessert",
];

const BAR_KEYWORDS = [
  "bar",
  "pub",
  "cocktail",
  "tiki",
  "brewery",
  "taproom",
  "wine",
  "lounge",
  "distillery",
  "sake",
  "spirits",
];

// Known cafe/bar names that don't match keywords
const MANUAL_INCLUDE = [
  "makeworth",
  "blank space",
  "bonito",
  "plantiful",
  "kemi",
  "starbucks reserve",
  "percy's",
  "rumba",
  "belmont",
  "liberty",
  "banter",
  "spruce",
  "provisions",
  "flatstick",
];

// Known non-cafe/bar names to exclude
const MANUAL_EXCLUDE = [
  "taco bell",
  "wendy's",
  "rentlucky",
  "uniqlo",
  "blick art",
  "patagonia",
  "sheraton",
  "amc ",
  "great wheel",
  "pacific science",
  "space needle",
  "kerry park",
  "olympic game",
  "sol duc",
  "hoh rain",
  "downtown park",
  "perrigo park",
  "alki beach",
  "idylwood park",
  "salt creek",
  "fremont sunday",
  "pike place market",
  "lake union hot tub",
  "chophouse row",
  "kinokuniya",
  "twice sold tales",
  "elliott bay book",
  "molly moon",
  "theo chocolate",
];

type Category = "cafe" | "bar" | "restaurant" | "skip";

function classify(name: string, reviewText?: string): Category {
  const lower = name.toLowerCase();
  const textLower = (reviewText ?? "").toLowerCase();
  const combined = lower + " " + textLower;

  // Check manual exclude first
  if (MANUAL_EXCLUDE.some((kw) => lower.includes(kw))) return "skip";

  // Check manual include
  if (MANUAL_INCLUDE.some((kw) => lower.includes(kw))) {
    if (BAR_KEYWORDS.some((kw) => lower.includes(kw))) return "bar";
    return "cafe";
  }

  // Check keywords
  if (CAFE_KEYWORDS.some((kw) => combined.includes(kw))) return "cafe";
  if (BAR_KEYWORDS.some((kw) => combined.includes(kw))) return "bar";

  // Everything else is a restaurant or unknown — include as potential
  return "restaurant";
}

interface CuratedEntry {
  name: string;
  address: string;
  lat: number;
  lng: number;
  neighborhood: string;
  category: Category;
  rating: number | null;
  reviewText: string | null;
  source: "review" | "saved" | "list";
  listName?: string;
}

// ---------- Process reviews ----------

const reviews = JSON.parse(readFileSync(join(DATA, "seattle-reviews.json"), "utf-8"));
const entries: CuratedEntry[] = [];
const seenNames = new Set<string>();

for (const f of reviews.features) {
  const name = f.properties.location?.name ?? "Unknown";
  const address = f.properties.location?.address ?? "";
  const [lng, lat] = f.geometry?.coordinates ?? [0, 0];
  const rating = f.properties.five_star_rating_published ?? null;
  const reviewText = f.properties.review_text_published ?? null;

  const category = classify(name, reviewText ?? undefined);
  if (category === "skip") continue;

  const key = name.toLowerCase().trim();
  if (seenNames.has(key)) continue;
  seenNames.add(key);

  // Guess neighborhood from address
  const parts = address.split(",").map((s: string) => s.trim());
  const neighborhood = parts.length >= 2 ? parts[1] : "";

  entries.push({
    name,
    address,
    lat,
    lng,
    neighborhood,
    category,
    rating,
    reviewText,
    source: "review",
  });
}

// ---------- Process saved places ----------

const saved = JSON.parse(readFileSync(join(DATA, "seattle-saved-places.json"), "utf-8"));

for (const f of saved.features) {
  const name = f.properties.location?.name ?? f.properties.Comment ?? "Unknown";
  const address = f.properties.location?.address ?? "";
  const [lng, lat] = f.geometry?.coordinates ?? [0, 0];

  const category = classify(name);
  if (category === "skip") continue;

  const key = name.toLowerCase().trim();
  if (seenNames.has(key)) continue;
  seenNames.add(key);

  const parts = address.split(",").map((s: string) => s.trim());
  const neighborhood = parts.length >= 2 ? parts[1] : "";

  entries.push({
    name,
    address,
    lat,
    lng,
    neighborhood,
    category,
    rating: null,
    reviewText: null,
    source: "saved",
  });
}

// ---------- Process CSV lists ----------

const lists: { list: string; title: string; url: string; note: string }[] =
  JSON.parse(readFileSync(join(DATA, "seattle-lists.json"), "utf-8"));

for (const item of lists) {
  const category = classify(item.title, item.note);
  if (category === "skip") continue;

  const key = item.title.toLowerCase().trim();
  if (seenNames.has(key)) continue;
  seenNames.add(key);

  // CSVs don't have coordinates — will need geocoding later
  entries.push({
    name: item.title,
    address: "",
    lat: 0,
    lng: 0,
    neighborhood: "",
    category,
    rating: null,
    reviewText: null,
    source: "list",
    listName: item.list,
  });
}

// ---------- Sort: cafes first, then bars, then restaurants ----------

const categoryOrder: Record<Category, number> = {
  cafe: 0,
  bar: 1,
  restaurant: 2,
  skip: 3,
};
entries.sort((a, b) => {
  const catDiff = categoryOrder[a.category] - categoryOrder[b.category];
  if (catDiff !== 0) return catDiff;
  return (b.rating ?? 0) - (a.rating ?? 0);
});

writeFileSync(join(DATA, "curated-cafes.json"), JSON.stringify(entries, null, 2));

// ---------- Summary ----------

const cafes = entries.filter((e) => e.category === "cafe");
const bars = entries.filter((e) => e.category === "bar");
const restaurants = entries.filter((e) => e.category === "restaurant");

const summary = `Curated Seattle Entries
========================
Cafes/Coffee/Matcha: ${cafes.length}
Bars/Cocktails:      ${bars.length}
Restaurants (other): ${restaurants.length}
Total:               ${entries.length}

=== CAFES & COFFEE (${cafes.length}) ===
${cafes.map((e) => `  ${e.rating ? e.rating + "★" : "  "} ${e.name} [${e.source}]${e.reviewText ? " — \"" + e.reviewText.slice(0, 50) + "...\"" : ""}`).join("\n")}

=== BARS & COCKTAILS (${bars.length}) ===
${bars.map((e) => `  ${e.rating ? e.rating + "★" : "  "} ${e.name} [${e.source}]${e.reviewText ? " — \"" + e.reviewText.slice(0, 50) + "...\"" : ""}`).join("\n")}

=== RESTAURANTS (${restaurants.length}) ===
${restaurants.map((e) => `  ${e.rating ? e.rating + "★" : "  "} ${e.name} [${e.source}]`).join("\n")}

Note: Restaurants are included for review but won't be imported
unless you want them. Edit data/curated-cafes.json to adjust.
`;

writeFileSync(join(DATA, "curated-summary.txt"), summary);
console.log(summary);
