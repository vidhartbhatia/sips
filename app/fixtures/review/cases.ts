// Made-up review data for the env-gated fixture routes (`/fixtures/review/[case]`), used by
// e2e/review.spec.ts. Fictional cafe and text; photos are inline SVG rectangles, so no image
// files are committed and nothing is fetched.

import { buildReviewPage, toPreviewInput, type ReviewPageInput } from "@/lib/review-view";
import type { Item, Photo, Review, ReviewAuthor } from "@/lib/supabase/types";

type Visit = Review & { author: ReviewAuthor | null };

/** A flat stone rectangle at the given aspect ratio, as a data: URI (next/image serves it as-is). */
function swatch(width: number, height: number, fill: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="${width}" height="${height}" fill="${fill}"/></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

const LANDSCAPE = swatch(1200, 800, "#E4DCD0");
const PORTRAIT = swatch(800, 1000, "#DCD2C4");

const CAFE_ID = "fixture-cafe";
const LEA: ReviewAuthor = { display_name: "Lea" };
const VIDS: ReviewAuthor = { display_name: "Vids" };

const cafe = (name: string, tags: string[]): ReviewPageInput["cafe"] => ({
  name,
  slug: "fixture-cafe",
  neighborhood: "Capitol Hill",
  address: "1200 E Pike St, Seattle, WA 98122",
  vibe_tags: tags,
  google_place_id: null,
});

function visit(id: string, date: string, over: Partial<Visit>): Visit {
  return {
    id,
    cafe_id: CAFE_ID,
    author_id: null,
    date_visited: date,
    note: null,
    overall_rating: null,
    verdict: null,
    cover_photo_id: null,
    status: "published",
    created_at: `${date}T17:00:00Z`,
    updated_at: `${date}T17:00:00Z`,
    author: null,
    ...over,
  };
}

let seq = 0;
const stamp = (date: string) => `${date}T17:${String(10 + (seq++ % 50)).padStart(2, "0")}:00Z`;

function drink(id: string, reviewId: string, date: string, over: Partial<Item>): Item {
  return {
    id,
    cafe_id: CAFE_ID,
    review_id: reviewId,
    name: "Cortado",
    category: "drink",
    type: null,
    rating: null,
    photo_url: null,
    notes: null,
    is_favorite: false,
    created_at: stamp(date),
    ...over,
  };
}

function pic(id: string, reviewId: string, date: string, url: string, over: Partial<Photo> = {}): Photo {
  return {
    id,
    cafe_id: CAFE_ID,
    review_id: reviewId,
    item_id: null,
    photo_url: url,
    caption: null,
    created_at: stamp(date),
    ...over,
  };
}

const STORY = [
  "We came in out of the drizzle just after ten, and the room was already full of laptops and quiet conversation. The light from the big front windows does most of the work here.",
  "The cortado was the reason to come back: sweet, round, with none of the sourness that a lot of light roasts lean into. The iced matcha was grassy and not too sweet, which is rarer than it should be.",
  "Seating is tight at the bar but the long communal table in the back is perfect for an hour of reading.",
];

const D1 = "2026-11-01";

const single: ReviewPageInput = {
  cafe: cafe("Larkspur Coffee", ["cozy", "laptop friendly", "great light"]),
  reviews: [
    visit("s-v1", D1, {
      author: LEA,
      overall_rating: 4,
      verdict: "A bright little room with a cortado worth crossing town for.",
      note: STORY.join("\n\n"),
      cover_photo_id: "s-hero",
    }),
  ],
  items: [
    drink("s-cortado", "s-v1", D1, { name: "Cortado", type: "Espresso", rating: 5, is_favorite: true, notes: "Sweet and round, no sourness." }),
    drink("s-matcha", "s-v1", D1, { name: "Iced matcha latte", type: "Matcha", rating: 4, notes: "Grassy, not too sweet." }),
    drink("s-lemonade", "s-v1", D1, { name: "Lavender lemonade", rating: 3 }),
  ],
  photos: [
    pic("s-strip-1", "s-v1", D1, PORTRAIT),
    pic("s-hero", "s-v1", D1, LANDSCAPE),
    pic("s-cortado-photo", "s-v1", D1, PORTRAIT, { item_id: "s-cortado" }),
    pic("s-strip-2", "s-v1", D1, PORTRAIT, { caption: "The long table in the back" }),
  ],
};

const M1 = "2026-11-08";
const M2 = "2026-09-20";
const M3 = "2026-06-14";

const multi: ReviewPageInput = {
  cafe: cafe("Larkspur Coffee", ["cozy", "great light"]),
  reviews: [
    visit("m-v2", M2, {
      author: VIDS,
      overall_rating: 4,
      verdict: "Solid on a busy Saturday, though the line moved slowly.",
      note: "Busier than last time. The flat white held up.",
    }),
    visit("m-v1", M1, {
      author: LEA,
      overall_rating: 5,
      verdict: "Our favourite morning spot on the hill, now with a hojicha latte.",
      note: STORY.slice(0, 2).join("\n"),
    }),
    visit("m-v3", M3, {
      author: LEA,
      overall_rating: 4,
      verdict: "A promising first visit.",
    }),
  ],
  items: [
    drink("m-hojicha", "m-v1", M1, { name: "Hojicha latte", type: "Tea", rating: 5, is_favorite: true }),
    drink("m-cortado", "m-v1", M1, { name: "Cortado", rating: 5 }),
    drink("m-flat-white", "m-v2", M2, { name: "Flat white", rating: 4, notes: "Silky, a little hot." }),
    drink("m-croissant", "m-v2", M2, { name: "Almond croissant", category: "food", rating: 3 }),
    drink("m-drip", "m-v3", M3, { name: "Drip coffee", rating: 4 }),
  ],
  photos: [
    pic("m-hero", "m-v1", M1, LANDSCAPE),
    pic("m-strip", "m-v1", M1, PORTRAIT),
    pic("m-v2-hero", "m-v2", M2, LANDSCAPE),
    pic("m-v2-flat", "m-v2", M2, PORTRAIT, { item_id: "m-flat-white" }),
  ],
};

const bare: ReviewPageInput = {
  cafe: cafe("Larkspur Coffee", []),
  reviews: [visit("b-v1", D1, { overall_rating: 3 })],
  items: [],
  photos: [],
};

const LONG_NAME = "The Very Long Name Coffee & Tea Roasters"; // 40 characters
const LONG_VERDICT =
  "Everything here is done with care, from the single-origin pour-overs to the tiny ceramic cups, and it's worth every minute of the long wait."; // 140

const long: ReviewPageInput = {
  cafe: cafe(LONG_NAME, ["cozy", "laptop friendly", "great light", "pastries", "outdoor seating", "quiet"]),
  reviews: [
    visit("l-v1", D1, {
      author: LEA,
      overall_rating: 5,
      verdict: LONG_VERDICT,
      note: [...STORY, ...STORY].join("\n"),
      cover_photo_id: "l-hero",
    }),
  ],
  items: [
    ["Cortado", "Espresso"],
    ["Ethiopian pour-over", "Filter"],
    ["Iced matcha latte", "Matcha"],
    ["Hojicha latte", "Tea"],
    ["Cardamom bun", null],
    ["Lavender lemonade", null],
    ["Oat milk cappuccino with an extra shot of the seasonal espresso", "Espresso"],
    ["Chai", "Tea"],
  ].map(([name, type], i) =>
    drink(`l-d${i}`, "l-v1", D1, {
      name: name as string,
      type,
      category: name === "Cardamom bun" ? "food" : "drink",
      rating: (i % 5) + 1,
      is_favorite: i === 0,
      notes: i % 2 === 0 ? "A longer note that wraps onto a second line on a phone screen, to check spacing." : null,
    }),
  ),
  photos: [
    pic("l-hero", "l-v1", D1, LANDSCAPE),
    pic("l-d0-photo", "l-v1", D1, PORTRAIT, { item_id: "l-d0" }),
    pic("l-d2-photo", "l-v1", D1, PORTRAIT, { item_id: "l-d2" }),
    pic("l-strip-1", "l-v1", D1, PORTRAIT),
    pic("l-strip-2", "l-v1", D1, PORTRAIT),
    pic("l-strip-3", "l-v1", D1, LANDSCAPE),
  ],
};

// The admin preview of a draft: dated before the published visit, yet it leads, and one
// drink is still unscored, so the banner says why it can't be published.
const P1 = "2026-11-10";
const P0 = "2026-11-03";
const draft = toPreviewInput({
  review: visit("d-draft", P0, {
    status: "draft",
    author: LEA,
    overall_rating: 3,
    verdict: "Lovely room, but the espresso ran thin today.",
    note: STORY[0],
  }),
  cafe: cafe("Larkspur Coffee", ["cozy", "great light"]),
  published: [
    visit("d-pub", P1, { author: VIDS, overall_rating: 5, verdict: "Still our favourite morning spot." }),
  ],
  items: [
    drink("d-cortado", "d-draft", P0, { name: "Cortado", rating: null }),
    drink("d-matcha", "d-draft", P0, { name: "Iced matcha latte", type: "Matcha", rating: 4 }),
    drink("d-flat", "d-pub", P1, { name: "Flat white", rating: 5 }),
  ],
  photos: [pic("d-hero", "d-draft", P0, LANDSCAPE), pic("d-pub-hero", "d-pub", P1, LANDSCAPE)],
});

export const cases: Record<string, ReviewPageInput> = { single, multi, bare, long, draft: draft.input };

/** Cases rendered as the admin preview (lead visit and banner) rather than the public page. */
export const previewLeads: Record<string, string> = { draft: draft.leadVisitId };

/** Where the made-up cafe would be (Capitol Hill), for the cafe JSON-LD's geo. */
export const FIXTURE_GEO = { lat: 47.6145, lng: -122.3205 };

/** A fixture case as the page and its share image render it, or null for an unknown case. */
export function loadFixture(name: string) {
  const input = Object.hasOwn(cases, name) ? cases[name] : null;
  const leadVisitId = Object.hasOwn(previewLeads, name) ? previewLeads[name] : undefined;
  const view = input ? buildReviewPage(input, { leadVisitId }) : null;
  return input && view ? { input, view, leadVisitId } : null;
}
