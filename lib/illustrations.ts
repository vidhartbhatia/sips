// Named illustration slots. Pages reference a slot, never a file path, so the owner's
// picks (K1) swap in here without touching any page. Plain module: safe in client code.

export type IllustrationSlot = "hero" | "logo" | "empty" | "404" | "about";
export type DoodleSlot = "coffee" | "matcha" | "tea" | "pastry";
export type OrnamentSlot = "ornament-1" | "ornament-2";

export type Asset = { src: string; width: number; height: number };

// The owner's picks (2026-11-17), style B. Sizes are each file's own viewBox or WebP canvas,
// so next/image reserves the right aspect ratio. Line art is SVG; the watercolour hero is WebP.
export const ILLUSTRATIONS: Record<IllustrationSlot, Asset> = {
  hero: { src: "/illustrations/hero.webp", width: 1536, height: 1024 },
  logo: { src: "/illustrations/logo.svg", width: 1000, height: 929 },
  empty: { src: "/illustrations/empty.svg", width: 777, height: 1000 },
  "404": { src: "/illustrations/404.svg", width: 1000, height: 420 },
  about: { src: "/illustrations/about.svg", width: 1108, height: 879 },
};

/**
 * The hero's art without the empty headline room on its left, for narrow screens where the
 * headline sits above the art. Use it with `getImageProps` in a `<picture>` (art direction).
 */
export const HERO_MOBILE: Asset = { src: "/illustrations/hero-mobile.webp", width: 698, height: 750 };

export const DOODLES: Partial<Record<DoodleSlot, Asset>> = {
  coffee: { src: "/illustrations/doodles/coffee.svg", width: 800, height: 693 },
  matcha: { src: "/illustrations/doodles/matcha.svg", width: 800, height: 711 },
  tea: { src: "/illustrations/doodles/tea.svg", width: 681, height: 800 },
  pastry: { src: "/illustrations/doodles/pastry.svg", width: 800, height: 647 },
};

export const ORNAMENTS: Partial<Record<OrnamentSlot, Asset>> = {
  "ornament-1": { src: "/illustrations/ornaments/ornament-1.svg", width: 800, height: 165 },
  "ornament-2": { src: "/illustrations/ornaments/ornament-2.svg", width: 800, height: 100 },
};

export const DIVIDER: Asset | null = { src: "/illustrations/dividers/sprig.svg", width: 1600, height: 59 };

// First match wins. Whole words only, so "steamed" never reads as "tea".
const DOODLE_RULES: ReadonlyArray<[DoodleSlot, RegExp]> = [
  ["matcha", /\b(?:matcha|hojicha)\b/i],
  ["tea", /\b(?:chai|teas?)\b/i],
  ["pastry", /\b(?:pastry|pastries|croissants?|cakes?|cookies?|scones?|buns?|toast)\b/i],
  [
    "coffee",
    /\b(?:espressos?|lattes?|cortados?|cappuccinos?|americanos?|macchiatos?|mochas?|flat whites?|pour.?overs?|drip|cold brew|coffees?)\b/i,
  ],
];

/**
 * The doodle for a drink or food item, or null when nothing fits (a lemonade is not a
 * coffee cup). Callers pass `[name, type].filter(Boolean).join(" ")`.
 */
export function doodleFor(text: string, category: "drink" | "food"): DoodleSlot | null {
  for (const [slot, pattern] of DOODLE_RULES) {
    if (slot === "pastry" && category === "food") return "pastry";
    if (pattern.test(text)) return slot;
  }
  return null;
}
