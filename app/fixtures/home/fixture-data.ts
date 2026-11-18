// Made-up cafes for the env-gated `/fixtures/home` and `/fixtures/cafes` routes (tests and
// design review only; they never render on Vercel). Covers are inline `data:` SVGs, so the
// fixtures need no storage and no network.

import type { CardCafe } from "@/components/cafes/CafeCard";
import type { VisitSummary } from "@/lib/listing";

function cover(sky: string, ground: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 200"><rect width="300" height="200" fill="${sky}"/><rect y="120" width="300" height="80" fill="${ground}"/><circle cx="150" cy="105" r="34" fill="#FFF8F0"/></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

type FixtureCafe = CardCafe & { summary: VisitSummary };

const CAFES: FixtureCafe[] = [
  {
    id: "f1",
    name: "Fixture Roasters",
    slug: "fixture-roasters",
    neighborhood: "Capitol Hill",
    overall_rating: 4.5,
    cover_photo_url: cover("#8BAA8F", "#6E625A"),
    summary: { verdict: "A cortado worth crossing town for.", latestVisit: "2026-11-10", visits: 2 },
  },
  {
    id: "f2",
    name: "Test Pattern Coffee",
    slug: "test-pattern-coffee",
    neighborhood: "Fremont",
    overall_rating: 4,
    cover_photo_url: cover("#C4735B", "#2C2420"),
    summary: { verdict: "Bright pour-over, quiet corner seats.", latestVisit: "2026-11-08", visits: 1 },
  },
  {
    id: "f3",
    name: "Sample Matcha House",
    slug: "sample-matcha-house",
    neighborhood: "Ballard",
    overall_rating: 3,
    cover_photo_url: null,
    summary: { verdict: "Fine iced matcha; we'd try the hojicha next.", latestVisit: "2026-11-05", visits: 1 },
  },
  {
    id: "f4",
    name: "Placeholder Espresso Bar",
    slug: "placeholder-espresso-bar",
    neighborhood: "Capitol Hill",
    overall_rating: 5,
    cover_photo_url: cover("#D4917D", "#8BAA8F"),
    summary: { verdict: "Go out of your way.", latestVisit: "2026-10-30", visits: 1 },
  },
  {
    id: "f5",
    name: "Mock Mill Cafe",
    slug: "mock-mill-cafe",
    neighborhood: "Georgetown",
    overall_rating: 2,
    cover_photo_url: cover("#6E625A", "#C4735B"),
    summary: { verdict: null, latestVisit: "2026-10-21", visits: 1 },
  },
  {
    id: "f6",
    name: "Stub & Saucer",
    slug: "stub-and-saucer",
    neighborhood: "Fremont",
    overall_rating: 3.5,
    cover_photo_url: cover("#2C2420", "#D4917D"),
    summary: {
      verdict: "A long verdict that keeps going so the card has to clamp it to two lines and never push the layout around.",
      latestVisit: "2026-10-12",
      visits: 3,
    },
  },
];

export const FIXTURE_CASES = { empty: 0, one: 1, two: 2, six: 6 } as const;
export type FixtureCase = keyof typeof FIXTURE_CASES;

export function isFixtureCase(value: string): value is FixtureCase {
  return Object.hasOwn(FIXTURE_CASES, value);
}

/** The first `n` fixture cafes (latest visit first) and their summaries. */
export function fixtureListing(c: FixtureCase): { cafes: CardCafe[]; summaries: Record<string, VisitSummary> } {
  const picked = CAFES.slice(0, FIXTURE_CASES[c]);
  return {
    cafes: picked.map(({ id, name, slug, neighborhood, overall_rating, cover_photo_url }) => ({
      id,
      name,
      slug,
      neighborhood,
      overall_rating,
      cover_photo_url,
    })),
    summaries: Object.fromEntries(picked.map((c) => [c.id, c.summary])),
  };
}
