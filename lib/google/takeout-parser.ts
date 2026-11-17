/**
 * Parsers for Google Takeout export files (Maps data).
 *
 * Handles three export shapes:
 *  1. Reviews.json   – GeoJSON FeatureCollection with star ratings & review text
 *  2. Saved Places.json – GeoJSON FeatureCollection of starred/saved places
 *  3. Want to go.csv  – CSV export of a saved list (Title, URL, Note)
 */

import type { Cafe, Review, WantToGo } from "@/lib/supabase/types";

// ---------------------------------------------------------------------------
// Public result types (Omit DB-generated fields)
// ---------------------------------------------------------------------------

export type ParsedCafe = Omit<
  Cafe,
  "id" | "created_at" | "updated_at" | "overall_rating"
>;

export type ParsedReview = Omit<
  Review,
  "id" | "cafe_id" | "author_id" | "created_at" | "updated_at"
>;

export type ParsedWantToGo = Omit<WantToGo, "id" | "created_at">;

export type ParsedReviewEntry = {
  cafe: ParsedCafe;
  review: ParsedReview;
};

export type ParsedSavedPlaceEntry = {
  cafe: ParsedCafe;
};

// Source tag so the UI can distinguish rows
export type ImportRow =
  | { source: "reviews"; cafe: ParsedCafe; review: ParsedReview }
  | { source: "starred"; cafe: ParsedCafe }
  | { source: "saved-list"; wantToGo: ParsedWantToGo };

// ---------------------------------------------------------------------------
// GeoJSON typings (subset used by Google Takeout)
// ---------------------------------------------------------------------------

interface TakeoutFeature {
  type: "Feature";
  geometry: {
    type: string;
    coordinates: [number, number]; // [lng, lat]
  };
  properties: {
    location?: {
      name?: string;
      address?: string;
    };
    google_maps_url?: string;
    date?: string;
    five_star_rating_published?: number;
    review_text_published?: string;
  };
}

interface TakeoutFeatureCollection {
  type: "FeatureCollection";
  features: TakeoutFeature[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Convert a name to a URL-friendly slug. */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/['']/g, "") // remove smart quotes
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Try to extract a neighbourhood from an address string (first comma-delimited segment after street). */
function guessNeighborhood(address: string): string {
  const parts = address.split(",").map((s) => s.trim());
  return parts.length >= 2 ? parts[1] : "";
}

// ---------------------------------------------------------------------------
// GeoJSON parsers
// ---------------------------------------------------------------------------

/**
 * Parse a Google Takeout `Reviews.json` file.
 * Returns matched cafe + review pairs.
 */
export function parseReviewsGeoJSON(json: string): ImportRow[] {
  const data: TakeoutFeatureCollection = JSON.parse(json);
  if (data.type !== "FeatureCollection" || !Array.isArray(data.features)) {
    throw new Error("Invalid GeoJSON: expected a FeatureCollection");
  }

  const rows: ImportRow[] = [];

  for (const feature of data.features) {
    const props = feature.properties ?? {};
    const loc = props.location ?? {};
    const name = loc.name ?? "Unknown";
    const address = loc.address ?? "";
    const [lng, lat] = feature.geometry?.coordinates ?? [0, 0];

    const cafe: ParsedCafe = {
      name,
      slug: slugify(name),
      address,
      lat,
      lng,
      neighborhood: guessNeighborhood(address),
      vibe_tags: [],
      cover_photo_url: null,
      google_place_id: null,
      status: "draft",
    };

    const review: ParsedReview = {
      date_visited: props.date
        ? new Date(props.date).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
      note: props.review_text_published ?? "",
      overall_rating: props.five_star_rating_published ?? 3,
      status: "draft",
    };

    rows.push({ source: "reviews", cafe, review });
  }

  return rows;
}

/**
 * Parse a Google Takeout `Saved Places.json` file (starred places).
 */
export function parseSavedPlacesGeoJSON(json: string): ImportRow[] {
  const data: TakeoutFeatureCollection = JSON.parse(json);
  if (data.type !== "FeatureCollection" || !Array.isArray(data.features)) {
    throw new Error("Invalid GeoJSON: expected a FeatureCollection");
  }

  const rows: ImportRow[] = [];

  for (const feature of data.features) {
    const props = feature.properties ?? {};
    const loc = props.location ?? {};
    const name = loc.name ?? "Unknown";
    const address = loc.address ?? "";
    const [lng, lat] = feature.geometry?.coordinates ?? [0, 0];

    const cafe: ParsedCafe = {
      name,
      slug: slugify(name),
      address,
      lat,
      lng,
      neighborhood: guessNeighborhood(address),
      vibe_tags: [],
      cover_photo_url: null,
      google_place_id: null,
      status: "draft",
    };

    rows.push({ source: "starred", cafe });
  }

  return rows;
}

// ---------------------------------------------------------------------------
// CSV parser
// ---------------------------------------------------------------------------

/**
 * Minimal CSV line parser that respects quoted fields.
 */
function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // skip escaped quote
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

/**
 * Parse a Google Takeout saved-list CSV (e.g. `Want to go.csv`).
 * Expected columns: Title, URL, Note (header row included).
 */
export function parseSavedListCSV(csv: string): ImportRow[] {
  const lines = csv
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length < 2) return []; // header only or empty

  // Skip header row
  const dataLines = lines.slice(1);
  const rows: ImportRow[] = [];

  for (const line of dataLines) {
    const fields = parseCSVLine(line);
    const title = fields[0] ?? "";
    const url = fields[1] ?? "";
    const note = fields[2] ?? "";

    if (!title) continue;

    const wantToGo: ParsedWantToGo = {
      name: title,
      address: "",
      lat: null,
      lng: null,
      source: "google_maps",
      notes: note || null,
      cafe_id: null,
    };

    rows.push({ source: "saved-list", wantToGo });
  }

  return rows;
}

// ---------------------------------------------------------------------------
// Auto-detect & parse
// ---------------------------------------------------------------------------

/**
 * Detect the file type and parse accordingly.
 * Works for both JSON (GeoJSON) and CSV files.
 */
export function parseTakeoutFile(
  content: string,
  filename: string
): ImportRow[] {
  const lower = filename.toLowerCase();

  if (lower.endsWith(".csv")) {
    return parseSavedListCSV(content);
  }

  // Must be JSON — try to detect reviews vs saved places
  const data = JSON.parse(content) as TakeoutFeatureCollection;

  // If any feature has a star rating or review text, treat as reviews file
  const hasReviews = data.features?.some(
    (f) =>
      f.properties?.five_star_rating_published !== undefined ||
      f.properties?.review_text_published !== undefined
  );

  if (hasReviews) {
    return parseReviewsGeoJSON(content);
  }

  return parseSavedPlacesGeoJSON(content);
}
