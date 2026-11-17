"use client";

interface ScoreInputProps {
  /** Whole number 1–5, or null for "not scored yet". */
  value: number | null;
  onChange: (value: number | null) => void;
  /** Accessible name for the group, e.g. "Overall score" or "Score for Cortado". */
  label: string;
}

/**
 * A 1–5 score with a real empty state. Nothing is pre-selected: tapping a selected score
 * again clears it, so a draft can be saved unscored and scored later.
 */
export default function ScoreInput({ value, onChange, label }: ScoreInputProps) {
  return (
    <div className="space-y-1.5">
      <div role="radiogroup" aria-label={label} className="grid max-w-xs grid-cols-5 gap-1.5">
        {[1, 2, 3, 4, 5].map((n) => {
          const selected = value === n;
          return (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={`${n} out of 5`}
              onClick={() => onChange(selected ? null : n)}
              className={`h-12 rounded-lg border font-mono text-base transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-espresso ${
                selected
                  ? "border-espresso bg-espresso text-cream"
                  : "border-espresso/[0.15] text-espresso hover:border-espresso/40"
              }`}
            >
              {n}
            </button>
          );
        })}
      </div>
      <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-espresso-muted" aria-live="polite">
        {value === null ? "not scored" : `${value}/5`}
      </span>
    </div>
  );
}
