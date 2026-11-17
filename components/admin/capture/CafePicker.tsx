"use client";

import { useRef, useState } from "react";
import { searchCafes } from "@/lib/actions/cafes";

export type CafeChoice =
  | { kind: "existing"; id: string; name: string; neighborhood: string }
  | { kind: "new"; name: string; neighborhood: string };

type CafeResult = { id: string; name: string; slug: string; neighborhood: string };

const NEIGHBORHOODS = [
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
];

interface CafePickerProps {
  value: CafeChoice | null;
  onChange: (value: CafeChoice | null) => void;
  inputClass: string;
}

/** Search the cafes, or add a new one (name + neighbourhood; created when the draft saves). */
export default function CafePicker({ value, onChange, inputClass }: CafePickerProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CafeResult[]>([]);
  const [searching, setSearching] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function search(text: string) {
    setQuery(text);
    if (timer.current) clearTimeout(timer.current);
    if (text.trim().length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    timer.current = setTimeout(async () => {
      const found = await searchCafes(text.trim());
      setResults(found);
      setSearching(false);
    }, 250);
  }

  if (value?.kind === "existing") {
    return (
      <div className="flex min-h-12 items-center justify-between gap-3 rounded-xl border border-espresso/[0.15] px-4 py-3">
        <div>
          <p className="font-medium text-espresso">{value.name}</p>
          <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-espresso-muted">{value.neighborhood}</p>
        </div>
        <button
          type="button"
          onClick={() => onChange(null)}
          className="min-h-12 px-2 text-sm text-terracotta-dark underline-offset-4 hover:underline"
        >
          Change
        </button>
      </div>
    );
  }

  if (value?.kind === "new") {
    return (
      <div className="space-y-3 rounded-xl border border-espresso/[0.15] p-4">
        <div className="flex items-center justify-between">
          <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-espresso-muted">New cafe</p>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="min-h-12 px-2 text-sm text-terracotta-dark underline-offset-4 hover:underline"
          >
            Search instead
          </button>
        </div>
        <label className="block">
          <span className="sr-only">Cafe name</span>
          <input
            type="text"
            value={value.name}
            onChange={(e) => onChange({ ...value, name: e.target.value })}
            placeholder="Cafe name"
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className="sr-only">Neighbourhood</span>
          <select
            value={value.neighborhood}
            onChange={(e) => onChange({ ...value, neighborhood: e.target.value })}
            className={inputClass}
          >
            <option value="">Neighbourhood…</option>
            {NEIGHBORHOODS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
      </div>
    );
  }

  return (
    <div>
      <label className="block">
        <span className="sr-only">Search cafes</span>
        <input
          type="search"
          value={query}
          onChange={(e) => search(e.target.value)}
          placeholder="Search cafes…"
          autoComplete="off"
          className={inputClass}
        />
      </label>
      {searching && <p className="mt-2 text-sm text-espresso-muted">Searching…</p>}
      {!searching && query.trim().length >= 2 && (
        <ul className="mt-2 divide-y divide-espresso/[0.06] rounded-xl border border-espresso/[0.1]">
          {results.map((cafe) => (
            <li key={cafe.id}>
              <button
                type="button"
                onClick={() =>
                  onChange({ kind: "existing", id: cafe.id, name: cafe.name, neighborhood: cafe.neighborhood })
                }
                className="flex min-h-12 w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-stone/60"
              >
                <span className="text-espresso">{cafe.name}</span>
                <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-espresso-muted">
                  {cafe.neighborhood}
                </span>
              </button>
            </li>
          ))}
          <li>
            <button
              type="button"
              onClick={() => onChange({ kind: "new", name: query.trim(), neighborhood: "" })}
              className="flex min-h-12 w-full items-center px-4 py-3 text-left text-terracotta-dark hover:bg-stone/60"
            >
              + Add &ldquo;{query.trim()}&rdquo; as a new cafe
            </button>
          </li>
        </ul>
      )}
    </div>
  );
}
