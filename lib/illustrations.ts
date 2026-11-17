// Named illustration slots. Pages reference a slot, never a file path, so the owner's
// picks (K1) swap in here without touching any page. Plain module: safe in client code.

export type IllustrationSlot = "hero" | "logo" | "empty" | "404" | "about";
export type DoodleSlot = "coffee" | "matcha" | "tea" | "pastry";
export type OrnamentSlot = "ornament-1" | "ornament-2";

export type Asset = { src: string; width: number; height: number };

// Until K1 these point at today's files (all 1024×1024 SVGs).
const coffeeCup: Asset = { src: "/illustrations/coffee-cup.svg", width: 1024, height: 1024 };

export const ILLUSTRATIONS: Record<IllustrationSlot, Asset> = {
  hero: { src: "/illustrations/cafe-scene.svg", width: 1024, height: 1024 },
  logo: coffeeCup,
  empty: coffeeCup,
  "404": coffeeCup,
  about: { src: "/illustrations/cat-with-cup.svg", width: 1024, height: 1024 },
};

export const DOODLES: Partial<Record<DoodleSlot, Asset>> = {};

export const ORNAMENTS: Partial<Record<OrnamentSlot, Asset>> = {};

export const DIVIDER: Asset | null = null;

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
