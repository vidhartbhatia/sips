// How the public cafe lists (home and /cafes) adapt to how many reviewed cafes exist.
// Plain module: safe in client code.

/** One cafe's published visits, as the cards need them. */
export type VisitSummary = { verdict: string | null; latestVisit: string; visits: number };

/** Home's "Recent sips": nothing yet, one or two featured cards, or a grid from three on. */
export function homeLayout(count: number): "empty" | "featured" | "grid" {
  if (count === 0) return "empty";
  if (count <= 2) return "featured";
  return "grid";
}

/** Filters only earn their space once there's enough to filter. */
export function showFilters(count: number): boolean {
  return count >= 6;
}

type VisitRow = { cafe_id: string; verdict: string | null; date_visited: string; created_at: string };

const isLater = (a: VisitRow, b: VisitRow) =>
  a.date_visited > b.date_visited || (a.date_visited === b.date_visited && a.created_at > b.created_at);

/**
 * Per cafe: the latest published visit's verdict and date, and the visit count. Dates are
 * ISO strings, so string comparison orders them; a same-day tie goes to the later entry.
 */
export function summarizeVisits(rows: VisitRow[]): Record<string, VisitSummary> {
  const latest = new Map<string, VisitRow>();
  const counts = new Map<string, number>();
  for (const row of rows) {
    counts.set(row.cafe_id, (counts.get(row.cafe_id) ?? 0) + 1);
    const current = latest.get(row.cafe_id);
    if (!current || isLater(row, current)) latest.set(row.cafe_id, row);
  }

  const summaries: Record<string, VisitSummary> = {};
  for (const [cafeId, row] of latest) {
    summaries[cafeId] = { verdict: row.verdict, latestVisit: row.date_visited, visits: counts.get(cafeId) ?? 1 };
  }
  return summaries;
}

/** A sort comparator: newest latest visit first. Cafes without a summary go last. */
export function byLatestVisit(summaries: Record<string, VisitSummary>) {
  return (a: { id: string }, b: { id: string }): number => {
    const da = summaries[a.id]?.latestVisit ?? "";
    const db = summaries[b.id]?.latestVisit ?? "";
    if (da === db) return 0;
    return da > db ? -1 : 1;
  };
}
