"use client";

import ScoreInput from "./ScoreInput";
import PhotoPicker from "./PhotoPicker";

export type DrinkDraft = {
  key: string;
  name: string;
  category: "drink" | "food";
  rating: number | null;
  is_favorite: boolean;
  notes: string;
  photo: File[];
};

export function emptyDrink(): DrinkDraft {
  return {
    key: crypto.randomUUID(),
    name: "",
    category: "drink",
    rating: null,
    is_favorite: false,
    notes: "",
    photo: [],
  };
}

interface DrinkListProps {
  drinks: DrinkDraft[];
  onChange: (drinks: DrinkDraft[]) => void;
  inputClass: string;
}

/** What we tried: each drink (or food) with an optional score, favourite, note and photo. */
export default function DrinkList({ drinks, onChange, inputClass }: DrinkListProps) {
  const update = (key: string, patch: Partial<DrinkDraft>) =>
    onChange(drinks.map((d) => (d.key === key ? { ...d, ...patch } : d)));

  return (
    <div className="space-y-4">
      {drinks.map((drink, i) => {
        const title = drink.name.trim() || `item ${i + 1}`;
        return (
          <fieldset key={drink.key} className="min-w-0 space-y-3 rounded-xl border border-espresso/[0.12] p-4">
            <legend className="sr-only">{title}</legend>
            <div className="flex items-center gap-2">
              <label className="flex-1">
                <span className="sr-only">Name</span>
                <input
                  type="text"
                  value={drink.name}
                  onChange={(e) => update(drink.key, { name: e.target.value })}
                  placeholder={drink.category === "drink" ? "Drink, e.g. hojicha latte" : "Food, e.g. cardamom bun"}
                  className={inputClass}
                />
              </label>
              <button
                type="button"
                onClick={() => onChange(drinks.filter((d) => d.key !== drink.key))}
                aria-label={`Remove ${title}`}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-xl text-espresso-muted hover:bg-stone"
              >
                &times;
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {(["drink", "food"] as const).map((category) => (
                <button
                  key={category}
                  type="button"
                  aria-pressed={drink.category === category}
                  onClick={() => update(drink.key, { category })}
                  className={`min-h-12 rounded-lg border px-4 font-mono text-[11px] uppercase tracking-[0.15em] ${
                    drink.category === category
                      ? "border-espresso bg-espresso text-cream"
                      : "border-espresso/[0.15] text-espresso"
                  }`}
                >
                  {category}
                </button>
              ))}
              <button
                type="button"
                aria-pressed={drink.is_favorite}
                onClick={() => update(drink.key, { is_favorite: !drink.is_favorite })}
                className={`min-h-12 rounded-lg border px-4 text-sm ${
                  drink.is_favorite
                    ? "border-terracotta-dark text-terracotta-dark"
                    : "border-espresso/[0.15] text-espresso-muted"
                }`}
              >
                {drink.is_favorite ? "♥ Favourite" : "♡ Favourite"}
              </button>
            </div>

            <ScoreInput
              value={drink.rating}
              onChange={(rating) => update(drink.key, { rating })}
              label={`Score for ${title}`}
            />

            <label className="block">
              <span className="sr-only">Note for {title}</span>
              <input
                type="text"
                value={drink.notes}
                onChange={(e) => update(drink.key, { notes: e.target.value })}
                placeholder="One-line note (optional)"
                className={inputClass}
              />
            </label>

            <PhotoPicker
              files={drink.photo}
              onChange={(photo) => update(drink.key, { photo })}
              label="Add a photo of it"
              multiple={false}
            />
          </fieldset>
        );
      })}

      <button
        type="button"
        onClick={() => onChange([...drinks, emptyDrink()])}
        className="flex min-h-12 w-full items-center justify-center rounded-xl border border-espresso/[0.15] text-sm text-espresso hover:bg-stone/60"
      >
        + Add {drinks.length === 0 ? "a drink" : "another"}
      </button>
    </div>
  );
}
