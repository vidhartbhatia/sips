// design-rules: enforced
"use client";

import ScoreInput from "@/components/admin/capture/ScoreInput";
import type { DraftItem } from "@/lib/actions/reviews";
import { isDrinkDirty } from "@/lib/item-rules";
import type { DrinkRow } from "./useDrinkRows";

interface DrinksEditorProps {
  rows: DrinkRow[];
  inputClass: string;
  onAdd: () => void;
  onChange: (key: string, values: Partial<DraftItem>) => void;
  /** Save a row if it has changes. */
  onSave: (key: string) => void;
  onRemove: (row: DrinkRow) => void;
}

const fieldLabel = "mb-1 block text-sm text-espresso-muted";

/**
 * What we tried, one row per drink (or food). Each row saves itself: score and toggle taps
 * right away, text fields when they lose focus. A new row is saved once it has a name.
 */
export default function DrinksEditor({ rows, inputClass, onAdd, onChange, onSave, onRemove }: DrinksEditorProps) {
  const set = (key: string, values: Partial<DraftItem>, saveNow = false) => {
    onChange(key, values);
    if (saveNow) onSave(key);
  };

  return (
    <div className="space-y-4">
      {rows.length === 0 && <p className="text-sm text-espresso-muted">No drinks yet.</p>}
      {rows.map((row, i) => {
        const title = row.values.name.trim() || `drink ${i + 1}`;
        const id = `drink-${row.key}`;
        return (
          <fieldset key={row.key} className="min-w-0 space-y-4 rounded-xl border border-espresso/[0.12] p-4">
            <legend className="sr-only">{title}</legend>

            <div className="flex items-end gap-2">
              <div className="flex-1">
                <label htmlFor={`${id}-name`} className={fieldLabel}>
                  Name
                </label>
                <input
                  id={`${id}-name`}
                  type="text"
                  value={row.values.name}
                  onChange={(e) => set(row.key, { name: e.target.value })}
                  onBlur={() => onSave(row.key)}
                  placeholder={row.values.category === "drink" ? "e.g. hojicha latte" : "e.g. cardamom bun"}
                  className={inputClass}
                />
              </div>
              <button
                type="button"
                onClick={() => onRemove(row)}
                disabled={row.saving}
                aria-label={`Remove ${title}`}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-xl text-espresso-muted hover:bg-stone disabled:opacity-60"
              >
                &times;
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {(["drink", "food"] as const).map((category) => (
                <button
                  key={category}
                  type="button"
                  aria-pressed={row.values.category === category}
                  onClick={() => set(row.key, { category }, true)}
                  className={`min-h-12 rounded-lg border px-4 font-mono text-[11px] uppercase tracking-[0.15em] ${
                    row.values.category === category
                      ? "border-espresso bg-espresso text-cream"
                      : "border-espresso/[0.15] text-espresso"
                  }`}
                >
                  {category}
                </button>
              ))}
              <button
                type="button"
                aria-pressed={row.values.is_favorite}
                onClick={() => set(row.key, { is_favorite: !row.values.is_favorite }, true)}
                className={`min-h-12 rounded-lg border px-4 text-sm ${
                  row.values.is_favorite
                    ? "border-terracotta-dark text-terracotta-dark"
                    : "border-espresso/[0.15] text-espresso-muted"
                }`}
              >
                {row.values.is_favorite ? "♥ Favourite" : "♡ Favourite"}
              </button>
            </div>

            <div>
              <label htmlFor={`${id}-type`} className={fieldLabel}>
                Type <span className="text-espresso-muted">(optional)</span>
              </label>
              <input
                id={`${id}-type`}
                type="text"
                value={row.values.type ?? ""}
                onChange={(e) => set(row.key, { type: e.target.value })}
                onBlur={() => onSave(row.key)}
                placeholder="e.g. oat milk, iced, ceremonial"
                className={inputClass}
              />
            </div>

            <div>
              <span className={fieldLabel} aria-hidden="true">
                Score
              </span>
              <ScoreInput
                value={row.values.rating}
                onChange={(rating) => set(row.key, { rating }, true)}
                label={`Score for ${title}`}
              />
            </div>

            <div>
              <label htmlFor={`${id}-notes`} className={fieldLabel}>
                Note <span className="text-espresso-muted">(optional)</span>
              </label>
              <input
                id={`${id}-notes`}
                type="text"
                value={row.values.notes ?? ""}
                onChange={(e) => set(row.key, { notes: e.target.value })}
                onBlur={() => onSave(row.key)}
                placeholder="One line"
                className={inputClass}
              />
            </div>

            <RowStatus row={row} />
          </fieldset>
        );
      })}

      <button
        type="button"
        onClick={onAdd}
        className="flex min-h-12 w-full items-center justify-center rounded-xl border border-espresso/[0.15] text-sm text-espresso hover:bg-stone/60"
      >
        + Add {rows.length === 0 ? "a drink" : "another"}
      </button>
    </div>
  );
}

function RowStatus({ row }: { row: DrinkRow }) {
  if (row.error) {
    return (
      <p role="alert" className="rounded-lg border border-terracotta-dark/40 px-3 py-2 text-sm text-espresso">
        {row.error}
      </p>
    );
  }
  const text = row.saving
    ? "Saving…"
    : !row.values.name.trim()
      ? "Name it to save"
      : isDrinkDirty(row.values, row.saved)
        ? "Not saved yet"
        : "Saved";
  return (
    <p aria-live="polite" className="font-mono text-[11px] uppercase tracking-[0.15em] text-espresso-muted">
      {text}
    </p>
  );
}
