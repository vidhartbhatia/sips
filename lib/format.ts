// Display formatting for public pages. Plain module: safe in server and client code.
// Dates are read from their "YYYY-MM-DD" text, never parsed into a JS date, so a
// visit on the 1st can't shift to the previous month in a western timezone.

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

/** "2026-11-01" → "November 2026". Uppercase it in CSS where the design wants caps. */
export function formatMonthYear(isoDate: string): string {
  const [year, month] = isoDate.split("-");
  const name = MONTHS[Number(month) - 1];
  if (!year || !name) return isoDate;
  return `${name} ${year}`;
}

/** 4 → "4", 4.5 → "4.5". */
export function formatScore(n: number): string {
  return String(n);
}

/** 1 → "1 visit", 2 → "2 visits". */
export function formatVisits(n: number): string {
  return `${n} ${n === 1 ? "visit" : "visits"}`;
}

/** Any run of newlines is a paragraph break (one Enter on a phone). No empty paragraphs. */
export function toParagraphs(text: string | null): string[] {
  if (!text) return [];
  return text
    .replace(/\r\n?/g, "\n")
    .split(/\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
}

/** Google Maps search link for a cafe, pinned to the place when we have its id. */
export function mapsUrl(name: string, address: string, placeId: string | null): string {
  const query = encodeURIComponent(`${name}, ${address}`);
  const base = `https://www.google.com/maps/search/?api=1&query=${query}`;
  return placeId ? `${base}&query_place_id=${encodeURIComponent(placeId)}` : base;
}
