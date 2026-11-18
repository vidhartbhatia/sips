// design-rules: enforced
"use client";

import { useId, useMemo, useState } from "react";
import { Illustration } from "@/components/ui/Illustration";
import { CafeCard, type CardCafe } from "@/components/cafes/CafeCard";
import { showFilters, type VisitSummary } from "@/lib/listing";

interface CafeGridProps {
  cafes: CardCafe[];
  summaries: Record<string, VisitSummary>;
}

const ALL = "All";

const SCORE_OPTIONS = [
  { value: 0, label: "Any" },
  { value: 3, label: "3+" },
  { value: 4, label: "4+" },
  { value: 4.5, label: "4.5+" },
] as const;

const FIELD =
  "w-full rounded-lg border border-espresso/20 bg-cream px-3 py-2 text-espresso focus:border-terracotta-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-terracotta-dark/40";
const LABEL = "mb-1 block font-mono text-[11px] uppercase tracking-[0.2em] text-espresso-muted";

/** The /cafes list. Filters appear only once there are enough cafes to need them. */
export default function CafeGrid({ cafes, summaries }: CafeGridProps) {
  const id = useId();
  const [search, setSearch] = useState("");
  const [neighborhood, setNeighborhood] = useState(ALL);
  const [minScore, setMinScore] = useState(0);

  const neighborhoods = useMemo(
    () => [ALL, ...Array.from(new Set(cafes.map((c) => c.neighborhood))).sort()],
    [cafes],
  );

  if (cafes.length === 0) {
    return (
      <div className="py-12 text-center">
        <Illustration slot="empty" className="mx-auto h-auto w-28" />
        <h2 className="mt-6 font-heading text-4xl text-espresso">First reviews soon.</h2>
      </div>
    );
  }

  const filtering = showFilters(cafes.length);
  const query = search.trim().toLowerCase();
  const filtered = filtering
    ? cafes.filter((cafe) => {
        if (query && !`${cafe.name} ${cafe.neighborhood}`.toLowerCase().includes(query)) return false;
        if (neighborhood !== ALL && cafe.neighborhood !== neighborhood) return false;
        if (minScore > 0 && (cafe.overall_rating === null || cafe.overall_rating < minScore)) return false;
        return true;
      })
    : cafes;

  const clearFilters = () => {
    setSearch("");
    setNeighborhood(ALL);
    setMinScore(0);
  };

  return (
    <>
      {filtering && (
        <div className="mt-8 grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-end">
          <div>
            <label htmlFor={`${id}-search`} className={LABEL}>
              Search
            </label>
            <input
              id={`${id}-search`}
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Name or neighborhood"
              className={`${FIELD} placeholder:text-espresso-muted`}
            />
          </div>
          <div>
            <label htmlFor={`${id}-neighborhood`} className={LABEL}>
              Neighborhood
            </label>
            <select
              id={`${id}-neighborhood`}
              value={neighborhood}
              onChange={(e) => setNeighborhood(e.target.value)}
              className={FIELD}
            >
              {neighborhoods.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor={`${id}-score`} className={LABEL}>
              Score
            </label>
            <select
              id={`${id}-score`}
              value={minScore}
              onChange={(e) => setMinScore(Number(e.target.value))}
              className={FIELD}
            >
              {SCORE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="py-12 text-center">
          <p className="font-display text-2xl italic text-espresso">No cafes match.</p>
          <button
            type="button"
            onClick={clearFilters}
            className="mt-4 font-medium text-terracotta-dark underline underline-offset-4 hover:text-espresso focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-terracotta-dark"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <ul className="mt-10 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((cafe) => (
            <li key={cafe.id}>
              <CafeCard cafe={cafe} summary={summaries[cafe.id]} variant="grid" />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
