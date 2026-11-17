// design-rules: enforced
import { formatScore, formatVisits } from "@/lib/format";

interface ScoreNumeralProps {
  value: number;
  visits?: number;
  size: "sm" | "lg";
}

const SIZES = {
  sm: { numeral: "text-sm", suffix: "text-[11px]" },
  lg: { numeral: "text-5xl leading-none", suffix: "text-base" },
} as const;

/**
 * A score as text: mono espresso numeral, muted "/5", and the visit count from two
 * visits on ("4.5 /5 · 2 visits"). The numeral carries the meaning; no cups or hearts.
 */
export function ScoreNumeral({ value, visits, size }: ScoreNumeralProps) {
  const score = formatScore(value);
  const showVisits = visits !== undefined && visits >= 2;
  const label = `Score ${score} out of 5${showVisits ? `, ${formatVisits(visits)}` : ""}`;
  const s = SIZES[size];

  return (
    <span role="img" aria-label={label} className="inline-flex items-baseline gap-1 font-mono">
      <span className={`${s.numeral} font-medium text-espresso`}>{score}</span>
      <span className={`${s.suffix} text-espresso-muted`}>/5</span>
      {showVisits && <span className={`${s.suffix} text-espresso-muted`}>· {formatVisits(visits)}</span>}
    </span>
  );
}

interface RatingGlyphProps {
  className?: string;
}

/** A small single-stroke espresso cup. Decorative: only beside `ScoreNumeral size="lg"`. */
export function RatingGlyph({ className }: RatingGlyphProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <path d="M7 12h15v6.5a6 6 0 0 1-6 6h-3a6 6 0 0 1-6-6V12Zm15 2h1.5a3 3 0 0 1 0 6H21.6M5 27.5h19M12.5 4.5c-1 1.5 1 2.5 0 4M16.5 4.5c-1 1.5 1 2.5 0 4" />
    </svg>
  );
}
