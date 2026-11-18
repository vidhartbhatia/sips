// The review page as data. Plain module (no "use server", no React): the public page
// (`/cafes/[slug]`), the admin draft preview and the test fixtures all build a
// `ReviewPageView` here and render it with one component (`components/review/ReviewArticle`).
// They differ only in their input.

import { formatMonthYear, mapsUrl, toParagraphs } from "@/lib/format";
import { doodleFor, type DoodleSlot } from "@/lib/illustrations";
import { averageRating } from "@/lib/ratings";
import { canPublish } from "@/lib/review-rules";
import type { Cafe, Item, Photo, Review, ReviewAuthor } from "@/lib/supabase/types";

type Visit = Review & { author: ReviewAuthor | null };

export type ReviewPageInput = {
  cafe: Pick<Cafe, "name" | "slug" | "neighborhood" | "address" | "lat" | "lng" | "vibe_tags" | "google_place_id">;
  reviews: Visit[];
  items: Item[];
  /** `photo_url` is already a signed URL; unsignable photos were already dropped by the query. */
  photos: Photo[];
};

export type VisitPhoto = { id: string; url: string; alt: string };

export type VisitDrink = {
  id: string;
  name: string;
  type: string | null;
  rating: number | null;
  isFavorite: boolean;
  note: string | null;
  photo: VisitPhoto | null;
  doodle: DoodleSlot | null;
};

export type VisitView = {
  id: string;
  status: "draft" | "published";
  dateVisited: string;
  monthYear: string;
  author: string | null;
  verdict: string | null;
  score: number | null;
  paragraphs: string[];
  hero: VisitPhoto | null;
  drinks: VisitDrink[];
  strip: VisitPhoto[];
};

export type ReviewPageView = {
  cafe: { name: string; slug: string; neighborhood: string; address: string; tags: string[]; mapsUrl: string };
  score: { value: number | null; visits: number };
  lead: VisitView;
  earlier: VisitView[];
};

const newestFirst = (a: Visit, b: Visit) =>
  b.date_visited.localeCompare(a.date_visited) || b.created_at.localeCompare(a.created_at);

const oldestFirst = (a: { created_at: string }, b: { created_at: string }) =>
  a.created_at.localeCompare(b.created_at);

const clean = (s: string | null | undefined): string | null => s?.trim() || null;

function buildVisit(visit: Visit, input: ReviewPageInput): VisitView {
  const cafeName = input.cafe.name;
  const monthYear = formatMonthYear(visit.date_visited);
  const photos = input.photos.filter((p) => p.review_id === visit.id).sort(oldestFirst);
  const items = input.items.filter((i) => i.review_id === visit.id).sort(oldestFirst);

  // Same rule as `pickCafeCover` (lib/cover-photo.ts), so the cafe card and the hero agree:
  // the chosen cover if it is one of this visit's (signed) photos, else the oldest photo.
  const heroRow = photos.find((p) => p.id === visit.cover_photo_id) ?? photos[0] ?? null;
  const hero: VisitPhoto | null = heroRow
    ? { id: heroRow.id, url: heroRow.photo_url, alt: clean(heroRow.caption) ?? `Our visit to ${cafeName}, ${monthYear}` }
    : null;

  // Each drink shows its first photo, unless that photo is already the hero. Any further
  // photos of the same drink stay in the strip, so nothing L. uploaded disappears.
  const shown = new Set<string>(hero ? [hero.id] : []);
  const drinks: VisitDrink[] = items.map((item) => {
    const row = photos.find((p) => p.item_id === item.id);
    const usable = row && row.id !== hero?.id ? row : null;
    if (usable) shown.add(usable.id);
    return {
      id: item.id,
      name: item.name,
      type: clean(item.type),
      rating: item.rating,
      isFavorite: item.is_favorite,
      note: clean(item.notes),
      photo: usable
        ? { id: usable.id, url: usable.photo_url, alt: clean(usable.caption) ?? `${item.name} at ${cafeName}` }
        : null,
      doodle: doodleFor([item.name, item.type].filter(Boolean).join(" "), item.category),
    };
  });

  const strip = photos
    .filter((p) => !shown.has(p.id))
    .map((p, i) => ({
      id: p.id,
      url: p.photo_url,
      alt: clean(p.caption) ?? `Photo ${i + 1} from our visit to ${cafeName}`,
    }));

  return {
    id: visit.id,
    status: visit.status,
    dateVisited: visit.date_visited,
    monthYear,
    author: clean(visit.author?.display_name),
    verdict: clean(visit.verdict),
    score: visit.overall_rating,
    paragraphs: toParagraphs(visit.note),
    hero,
    drinks,
    strip,
  };
}

/**
 * Turns a cafe and its visits into the review page. The lead visit is `opts.leadVisitId`
 * when present (the draft preview), else the newest; the rest are earlier visits, newest
 * first. The header score is the mean of every scored visit in the input, so a preview
 * shows the score the page will have once the draft is published. No visits → null.
 */
export function buildReviewPage(
  input: ReviewPageInput,
  opts?: { leadVisitId?: string },
): ReviewPageView | null {
  const visits = [...input.reviews].sort(newestFirst);
  if (visits.length === 0) return null;

  const lead = visits.find((v) => v.id === opts?.leadVisitId) ?? visits[0];
  const scores = visits.map((v) => v.overall_rating).filter((r): r is number => r !== null);
  const { cafe } = input;

  return {
    cafe: {
      name: cafe.name,
      slug: cafe.slug,
      neighborhood: cafe.neighborhood,
      address: cafe.address,
      tags: cafe.vibe_tags ?? [],
      mapsUrl: mapsUrl(cafe.name, cafe.address, cafe.google_place_id),
    },
    score: { value: averageRating(scores), visits: scores.length },
    lead: buildVisit(lead, input),
    earlier: visits.filter((v) => v !== lead).map((v) => buildVisit(v, input)),
  };
}

/**
 * The draft preview's input: the previewed review (any status) plus the cafe's published
 * reviews, de-duplicated, with only their items and photos. Every other draft is left out.
 */
export function toPreviewInput(rows: {
  review: Visit;
  cafe: ReviewPageInput["cafe"];
  published: Visit[];
  items: Item[];
  photos: Photo[];
}): { input: ReviewPageInput; leadVisitId: string } {
  const others = rows.published.filter((r) => r.status === "published" && r.id !== rows.review.id);
  const reviews = [rows.review, ...others];
  const ids = new Set(reviews.map((r) => r.id));
  const ours = (row: { review_id: string | null }) => row.review_id !== null && ids.has(row.review_id);

  return {
    input: {
      cafe: rows.cafe,
      reviews,
      items: rows.items.filter(ours),
      photos: rows.photos.filter(ours),
    },
    leadVisitId: rows.review.id,
  };
}

/**
 * Why a draft can't be published yet ("Score every drink before publishing: Cortado."), or
 * null when it can, or when the visit is already published or not in the input.
 */
export function publishBlocker(input: ReviewPageInput, visitId: string): string | null {
  const visit = input.reviews.find((r) => r.id === visitId);
  if (!visit || visit.status !== "draft") return null;
  const check = canPublish(visit, input.items.filter((i) => i.review_id === visitId), input.cafe);
  return check.ok ? null : check.reason;
}
