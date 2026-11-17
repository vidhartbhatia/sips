/**
 * Extract Seattle-area data from Google Takeout exports.
 *
 * Usage: npx tsx scripts/extract-seattle.ts
 *
 * Reads from:  Takeout/Maps (your places)/Reviews.json
 *              Takeout/Maps (your places)/Saved Places.json
 *              Takeout/Saved/Seattle.csv
 *              Takeout/Saved/Coffee.csv
 *              Takeout/Saved/Bars.csv
 *
 * Writes to:   data/seattle-reviews.json
 *              data/seattle-saved-places.json
 *              data/seattle-lists.json    (merged CSVs)
 *              data/seattle-summary.txt
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const TAKEOUT = join(ROOT, "Takeout");
const OUT = join(ROOT, "data");

// Seattle metro bounding box (generous — includes Bellevue, Kirkland, etc.)
const SEA_LAT_MIN = 47.3;
const SEA_LAT_MAX = 47.85;
const SEA_LNG_MIN = -122.55;
const SEA_LNG_MAX = -122.0;

// Address keywords that indicate Seattle area
const SEA_KEYWORDS = [
  "seattle",
  ", wa ",
  ", wa,",
  "washington",
  "bellevue",
  "kirkland",
  "redmond",
  "renton",
  "bothell",
  "mercer island",
  "shoreline",
  "burien",
  "tukwila",
  "issaquah",
  "woodinville",
  "kenmore",
  "sammamish",
  "lynnwood",
  "edmonds",
  "bainbridge",
];

function isSeattleCoords(lng: number, lat: number): boolean {
  if (lng === 0 && lat === 0) return false; // no location data
  return (
    lat >= SEA_LAT_MIN &&
    lat <= SEA_LAT_MAX &&
    lng >= SEA_LNG_MIN &&
    lng <= SEA_LNG_MAX
  );
}

function isSeattleText(text: string): boolean {
  const lower = text.toLowerCase();
  return SEA_KEYWORDS.some((kw) => lower.includes(kw));
}

interface Feature {
  type: string;
  geometry: { coordinates: [number, number]; type: string };
  properties: {
    location?: { address?: string; name?: string; country_code?: string };
    google_maps_url?: string;
    date?: string;
    five_star_rating_published?: number;
    review_text_published?: string;
    questions?: { question: string; rating: number }[];
    Comment?: string;
  };
}

interface FeatureCollection {
  type: string;
  features: Feature[];
}

function isSeattleFeature(f: Feature): boolean {
  const [lng, lat] = f.geometry?.coordinates ?? [0, 0];
  if (isSeattleCoords(lng, lat)) return true;

  const addr = f.properties?.location?.address ?? "";
  if (isSeattleText(addr)) return true;

  const url = f.properties?.google_maps_url ?? "";
  if (isSeattleText(url)) return true;

  return false;
}

// ---------- CSV parsing (same as takeout-parser) ----------

function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      fields.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  fields.push(current.trim());
  return fields;
}

// ---------- Main ----------

mkdirSync(OUT, { recursive: true });

// 1. Filter Reviews.json
console.log("Processing Reviews.json...");
const reviewsRaw = readFileSync(
  join(TAKEOUT, "Maps (your places)", "Reviews.json"),
  "utf-8"
);
const reviewsData: FeatureCollection = JSON.parse(reviewsRaw);
const seattleReviews = reviewsData.features.filter(isSeattleFeature);

// Deduplicate reviews (same place can have rating-only + review entries)
const reviewsByPlace = new Map<string, Feature[]>();
for (const f of seattleReviews) {
  const name = f.properties?.location?.name ?? "Unknown";
  const key = name.toLowerCase().trim();
  if (!reviewsByPlace.has(key)) reviewsByPlace.set(key, []);
  reviewsByPlace.get(key)!.push(f);
}

// For each place, keep the entry with the most info (review text > rating only)
const dedupedReviews: Feature[] = [];
for (const [, entries] of reviewsByPlace) {
  // Prefer entry with review text
  const withText = entries.find((e) => e.properties.review_text_published);
  const withRating = entries.find(
    (e) =>
      e.properties.five_star_rating_published !== undefined &&
      e.properties.five_star_rating_published > 0
  );
  dedupedReviews.push(withText ?? withRating ?? entries[0]);
}

// Filter out 0-star ratings (those are just "rated" without actual rating)
const meaningfulReviews = dedupedReviews.filter(
  (f) =>
    (f.properties.five_star_rating_published ?? 0) > 0 ||
    f.properties.review_text_published
);

writeFileSync(
  join(OUT, "seattle-reviews.json"),
  JSON.stringify(
    { type: "FeatureCollection", features: meaningfulReviews },
    null,
    2
  )
);
console.log(
  `  ${reviewsData.features.length} total → ${seattleReviews.length} Seattle area → ${meaningfulReviews.length} after dedup`
);

// 2. Filter Saved Places.json
console.log("Processing Saved Places.json...");
const savedRaw = readFileSync(
  join(TAKEOUT, "Maps (your places)", "Saved Places.json"),
  "utf-8"
);
const savedData: FeatureCollection = JSON.parse(savedRaw);
const seattleSaved = savedData.features.filter(isSeattleFeature);
writeFileSync(
  join(OUT, "seattle-saved-places.json"),
  JSON.stringify(
    { type: "FeatureCollection", features: seattleSaved },
    null,
    2
  )
);
console.log(
  `  ${savedData.features.length} total → ${seattleSaved.length} Seattle area`
);

// 3. Process relevant CSVs
console.log("Processing CSV lists...");
const csvFiles = ["Seattle.csv", "Coffee.csv", "Bars.csv"];
const listEntries: { list: string; title: string; url: string; note: string }[] = [];

for (const file of csvFiles) {
  const path = join(TAKEOUT, "Saved", file);
  if (!existsSync(path)) {
    console.log(`  Skipping ${file} (not found)`);
    continue;
  }
  const csv = readFileSync(path, "utf-8");
  const lines = csv.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const headerIdx = lines.findIndex((l) => l.toLowerCase().includes("title"));
  if (headerIdx === -1) {
    console.log(`  Skipping ${file} (no header found)`);
    continue;
  }

  const dataLines = lines.slice(headerIdx + 1);
  let count = 0;
  for (const line of dataLines) {
    const fields = parseCSVLine(line);
    const title = fields[0] ?? "";
    const note = fields[1] ?? "";
    const url = fields[2] ?? "";
    if (title) {
      listEntries.push({ list: file.replace(".csv", ""), title, url, note });
      count++;
    }
  }
  console.log(`  ${file}: ${count} entries`);
}

writeFileSync(join(OUT, "seattle-lists.json"), JSON.stringify(listEntries, null, 2));

// 4. Summary
const summary = `Seattle Data Extraction Summary
================================
Date: ${new Date().toISOString().split("T")[0]}

Reviews: ${meaningfulReviews.length} places with ratings/reviews
  (from ${reviewsData.features.length} total reviews worldwide)

Saved Places: ${seattleSaved.length} starred places
  (from ${savedData.features.length} total saved places)

CSV Lists: ${listEntries.length} entries from ${csvFiles.join(", ")}

Review breakdown by rating:
${[5, 4, 3, 2, 1]
  .map((r) => {
    const count = meaningfulReviews.filter(
      (f) => f.properties.five_star_rating_published === r
    ).length;
    return `  ${r} stars: ${count}`;
  })
  .join("\n")}

Top places (5-star reviews):
${meaningfulReviews
  .filter((f) => f.properties.five_star_rating_published === 5)
  .map((f) => `  - ${f.properties.location?.name ?? "Unknown"}`)
  .join("\n")}
`;

writeFileSync(join(OUT, "seattle-summary.txt"), summary);
console.log("\n" + summary);
console.log(`\nFiles written to ${OUT}/`);
