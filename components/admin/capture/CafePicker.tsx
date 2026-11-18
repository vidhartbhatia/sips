"use client";

import { useEffect, useRef, useState } from "react";
import { getPlace, searchCafes, searchPlaces } from "@/lib/actions/cafes";
import { NEIGHBORHOODS } from "@/lib/neighborhoods";
import type { PlaceSuggestion, PlacesResult } from "@/lib/google/places";

/** Where Google says a new cafe is. Null when it was added by name only. */
export interface PickedPlace {
  placeId: string;
  address: string;
  lat: number;
  lng: number;
}

export type CafeChoice =
  | { kind: "existing"; id: string; name: string; neighborhood: string }
  | { kind: "new"; name: string; neighborhood: string; place: PickedPlace | null };

type CafeResult = { id: string; name: string; slug: string; neighborhood: string };

interface CafePickerProps {
  value: CafeChoice | null;
  onChange: (value: CafeChoice | null) => void;
  inputClass: string;
}

/**
 * Search the cafes, or add a new one: found through Google place search (name, address,
 * coordinates, suggested neighbourhood), or by name only when Google can't help. A new cafe
 * is created when the draft saves.
 */
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
    return <NewCafe value={value} onChange={onChange} inputClass={inputClass} />;
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
              onClick={() => onChange({ kind: "new", name: query.trim(), neighborhood: "", place: null })}
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

interface NewCafeProps {
  value: Extract<CafeChoice, { kind: "new" }>;
  onChange: (value: CafeChoice | null) => void;
  inputClass: string;
}

const label = "font-mono text-[11px] uppercase tracking-[0.15em] text-espresso-muted";
const linkButton = "min-h-12 px-2 text-sm text-terracotta-dark underline-offset-4 hover:underline";

/**
 * A new cafe: search Google for it (debounced, one billing session per search), or add it by
 * name only. Its own component so its search state resets each time "new cafe" opens.
 */
function NewCafe({ value, onChange, inputClass }: NewCafeProps) {
  const [manual, setManual] = useState(false);
  const [query, setQuery] = useState(value.name);
  const [found, setFound] = useState<{ query: string; result: PlacesResult<PlaceSuggestion[]> } | null>(null);
  const [picking, setPicking] = useState<string | null>(null);
  const [pickError, setPickError] = useState<string | null>(null);
  const [suggested, setSuggested] = useState<string | null>(null);
  // One token from the first keystroke to the pick; Google bills that as one session.
  const session = useRef<string>(crypto.randomUUID());
  const latest = useRef(0);

  const text = query.trim();
  const searching = !manual && !value.place && text.length >= 2 && found?.query !== text;

  useEffect(() => {
    if (manual || value.place || text.length < 2) return;
    const seq = ++latest.current;
    const timer = setTimeout(async () => {
      const result = await searchPlaces(text, session.current).catch(
        (): PlacesResult<PlaceSuggestion[]> => ({ ok: false, error: "Couldn't reach Google place search." }),
      );
      // A slower, older response must not replace a newer one.
      if (seq === latest.current) setFound({ query: text, result });
    }, 300);
    return () => clearTimeout(timer);
  }, [text, manual, value.place]);

  async function pick(s: PlaceSuggestion) {
    setPicking(s.placeId);
    setPickError(null);
    const res = await getPlace(s.placeId, session.current).catch(
      () => ({ ok: false, error: "Couldn't reach Google place search." }) as const,
    );
    setPicking(null);
    // The details call ends the session; a new search starts a new one.
    session.current = crypto.randomUUID();
    if (!res.ok) {
      setPickError(res.error);
      return;
    }
    const { placeId, name, address, lat, lng, neighborhood } = res.data;
    setSuggested(neighborhood);
    onChange({
      kind: "new",
      name: name || s.name,
      neighborhood: neighborhood ?? value.neighborhood,
      place: { placeId, address, lat, lng },
    });
  }

  function searchAgain() {
    setManual(false);
    setFound(null);
    setSuggested(null);
    setQuery(value.name);
    onChange({ ...value, neighborhood: "", place: null });
  }

  const header = (
    <div className="flex items-center justify-between">
      <p className={label}>New cafe</p>
      <button type="button" onClick={() => onChange(null)} className={linkButton}>
        Search Sips instead
      </button>
    </div>
  );

  const neighbourhood = (
    <div>
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
      {suggested && value.neighborhood === suggested && (
        <p className="mt-1 text-sm text-espresso-muted">From Google&rsquo;s address. Change it if it&rsquo;s off.</p>
      )}
    </div>
  );

  const nameInput = (
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
  );

  // Picked from Google: the name stays editable (Google's can be long), the address is fixed.
  if (value.place) {
    return (
      <div className="space-y-3 rounded-xl border border-espresso/[0.15] p-4">
        {header}
        {nameInput}
        <div className="flex items-start justify-between gap-3">
          <p className="pt-3 text-sm text-espresso" data-testid="new-cafe-address">
            {value.place.address}
          </p>
          <button type="button" onClick={searchAgain} className={`${linkButton} shrink-0`}>
            Wrong place?
          </button>
        </div>
        {neighbourhood}
      </div>
    );
  }

  // Added by name only: no address yet, so it can't be published until one is set.
  if (manual) {
    return (
      <div className="space-y-3 rounded-xl border border-espresso/[0.15] p-4">
        {header}
        {nameInput}
        {neighbourhood}
        <p className="text-sm text-espresso-muted">
          No address yet. You can save the draft; add the address on the cafe&rsquo;s page before publishing.
        </p>
        <button type="button" onClick={searchAgain} className={`${linkButton} -ml-2`}>
          Search Google Maps instead
        </button>
      </div>
    );
  }

  const failed = found?.query === text && !found.result.ok ? found.result.error : null;
  const suggestions = found?.query === text && found.result.ok ? found.result.data : [];

  return (
    <div className="space-y-3 rounded-xl border border-espresso/[0.15] p-4">
      {header}
      <label className="block">
        <span className="sr-only">Find the cafe on Google Maps</span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Find it on Google Maps…"
          autoComplete="off"
          autoFocus
          className={inputClass}
        />
      </label>
      {searching && <p className="text-sm text-espresso-muted">Searching Google Maps…</p>}
      {(failed || pickError) && (
        <p role="alert" className="text-sm text-terracotta-dark">
          {pickError ?? failed} You can add it by name and set the address later.
        </p>
      )}
      {!searching && text.length >= 2 && (
        <ul className="divide-y divide-espresso/[0.06] rounded-xl border border-espresso/[0.1]">
          {suggestions.map((s) => (
            <li key={s.placeId}>
              <button
                type="button"
                onClick={() => pick(s)}
                disabled={picking !== null}
                className="flex min-h-12 w-full flex-col items-start justify-center px-4 py-3 text-left hover:bg-stone/60 disabled:opacity-60"
              >
                <span className="text-espresso">{s.name}</span>
                {s.detail && <span className="text-sm text-espresso-muted">{s.detail}</span>}
              </button>
            </li>
          ))}
          {!failed && suggestions.length === 0 && (
            <li className="px-4 py-3 text-sm text-espresso-muted">Nothing on Google Maps by that name.</li>
          )}
        </ul>
      )}
      {picking && <p className="text-sm text-espresso-muted">Getting the address…</p>}
      <button
        type="button"
        onClick={() => {
          setManual(true);
          onChange({ ...value, name: text || value.name, place: null });
        }}
        className={`${linkButton} -ml-2`}
      >
        Can&rsquo;t find it? Add by name only
      </button>
    </div>
  );
}
