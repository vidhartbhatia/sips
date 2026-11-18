// Plain module (no "use server"): the neighbourhood list the admin forms offer, and the mapping
// from a Google place's address components onto it.

export const NEIGHBORHOODS = [
  "Ballard",
  "Beacon Hill",
  "Capitol Hill",
  "Columbia City",
  "Fremont",
  "Georgetown",
  "Pike Place",
  "Pioneer Square",
  "Queen Anne",
  "University District",
  "Wallingford",
  "Other",
] as const;

/** One entry of a Place Details (New) `addressComponents` list. */
export interface AddressComponent {
  longText?: string;
  shortText?: string;
  types?: string[];
}

// Google's names that mean one of ours without containing it.
const ALIASES: Record<string, string> = {
  "u district": "University District",
  "pike place market": "Pike Place",
  uptown: "Queen Anne",
};

const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

function match(text: string): string | null {
  const t = normalize(text);
  if (!t) return null;
  if (ALIASES[t]) return ALIASES[t];
  // "North Capitol Hill", "Lower Queen Anne" and "North Beacon Hill" all contain one of ours.
  return NEIGHBORHOODS.find((n) => n !== "Other" && ` ${t} `.includes(` ${normalize(n)} `)) ?? null;
}

/**
 * Suggest one of our neighbourhoods from a Google place's address components: the
 * `neighborhood` first, then the sublocalities. Null when nothing maps (the form then asks).
 */
export function neighborhoodFromComponents(components: readonly AddressComponent[] | undefined): string | null {
  if (!components) return null;
  const order = ["neighborhood", "sublocality_level_1", "sublocality"];
  for (const type of order) {
    for (const c of components) {
      if (!c.types?.includes(type)) continue;
      const found = match(c.longText ?? "") ?? match(c.shortText ?? "");
      if (found) return found;
    }
  }
  return null;
}
