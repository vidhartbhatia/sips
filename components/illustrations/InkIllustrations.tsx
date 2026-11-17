"use client";

/**
 * Hand-drawn ink illustrations for Sips.
 *
 * Style: bold, loose brush-pen strokes on paper. Inspired by
 * inspo-1 (Mari Kuznetsova) and inspo-4 (Pause tea cups).
 * Thick confident lines, intentionally imperfect, like quick
 * cafe sketches. Single color (espresso or ink-blue).
 */

interface IllustrationProps {
  className?: string;
  color?: string;
  size?: number;
}

const INK = "currentColor";

/* ────────────────────────────────────────────
 * COFFEE & DRINKS
 * ──────────────────────────────────────────── */

/** Chunky latte cup with saucer — the signature Sips cup */
export function InkLatteCup({ className = "", size = 120 }: IllustrationProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 110"
      fill="none"
      className={className}
    >
      {/* Saucer — loose oval */}
      <path
        d="M14,88 C14,82 38,76 60,76 C82,76 106,82 106,88 C106,94 82,98 60,98 C38,98 14,94 14,88Z"
        stroke={INK}
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      {/* Cup body — chunky, slightly wonky */}
      <path
        d="M28,42 C26,44 24,68 26,74 C28,80 72,82 74,74 C76,66 74,44 72,42"
        stroke={INK}
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      {/* Cup rim — thick confident line */}
      <path
        d="M26,42 C26,38 74,36 74,42"
        stroke={INK}
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />
      {/* Handle — bold loop */}
      <path
        d="M74,48 C84,46 92,52 92,60 C92,68 84,74 74,70"
        stroke={INK}
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      {/* Latte art — simple leaf swirl */}
      <path
        d="M42,46 C46,50 50,48 54,52 C50,50 46,52 42,48"
        stroke={INK}
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.4"
        fill="none"
      />
      {/* Steam — loose wavy lines */}
      <path
        d="M38,36 C36,28 40,22 38,14"
        stroke={INK}
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.15"
      />
      <path
        d="M50,34 C48,24 52,18 50,10"
        stroke={INK}
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.2"
      />
      <path
        d="M62,36 C60,28 64,22 62,14"
        stroke={INK}
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.12"
      />
    </svg>
  );
}

/** Small espresso cup — quick sketch style */
export function InkEspressoCup({
  className = "",
  size = 80,
}: IllustrationProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      fill="none"
      className={className}
    >
      {/* Cup body — short and stout */}
      <path
        d="M18,30 C16,32 14,52 16,58 C18,64 54,66 56,58 C58,50 56,32 54,30"
        stroke={INK}
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      {/* Rim */}
      <path
        d="M16,30 C16,26 56,26 56,30"
        stroke={INK}
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      {/* Handle */}
      <path
        d="M56,36 C64,34 68,40 68,46 C68,52 64,56 56,54"
        stroke={INK}
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      {/* Saucer line */}
      <path
        d="M8,68 C8,64 64,62 64,68"
        stroke={INK}
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      {/* Steam — single wisp */}
      <path
        d="M34,24 C32,16 36,10 34,4"
        stroke={INK}
        strokeWidth="1.8"
        strokeLinecap="round"
        opacity="0.18"
      />
    </svg>
  );
}

/** Matcha bowl — wide, ceremonial style */
export function InkMatchaBowl({
  className = "",
  size = 100,
}: IllustrationProps) {
  return (
    <svg
      width={size}
      height={size * 0.7}
      viewBox="0 0 100 70"
      fill="none"
      className={className}
    >
      {/* Bowl — wide and shallow, bold strokes */}
      <path
        d="M10,24 C8,28 12,52 18,56 C28,62 72,62 82,56 C88,52 92,28 90,24"
        stroke={INK}
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      {/* Rim */}
      <path
        d="M8,24 C8,20 92,18 92,24"
        stroke={INK}
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />
      {/* Matcha surface — wavy line */}
      <path
        d="M20,28 C30,26 40,30 50,28 C60,26 70,30 80,28"
        stroke={INK}
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.25"
        fill="none"
      />
      {/* Whisk marks */}
      <path
        d="M40,30 L42,36 M46,30 L48,36 M52,30 L54,36"
        stroke={INK}
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.15"
      />
    </svg>
  );
}

/** Cocktail glass — martini/coupe style */
export function InkCocktailGlass({
  className = "",
  size = 100,
}: IllustrationProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 100"
      fill="none"
      className={className}
    >
      {/* Glass bowl — triangle/coupe shape */}
      <path
        d="M12,16 L40,52 L68,16"
        stroke={INK}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Rim */}
      <path
        d="M10,16 C10,12 70,12 70,16"
        stroke={INK}
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      {/* Stem */}
      <path
        d="M40,52 L40,80"
        stroke={INK}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Base */}
      <path
        d="M26,82 C26,78 54,78 54,82"
        stroke={INK}
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      {/* Garnish — olive or cherry */}
      <circle
        cx="52"
        cy="24"
        r="4"
        stroke={INK}
        strokeWidth="2"
        fill="none"
      />
      <path
        d="M52,20 L56,12"
        stroke={INK}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Takeaway cup — to-go style */
export function InkTakeawayCup({
  className = "",
  size = 90,
}: IllustrationProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 70 100"
      fill="none"
      className={className}
    >
      {/* Cup body — tapered */}
      <path
        d="M18,28 C16,30 20,82 22,86 C24,90 46,90 48,86 C50,82 54,30 52,28"
        stroke={INK}
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      {/* Lid */}
      <path
        d="M14,28 C14,24 56,22 56,28"
        stroke={INK}
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M16,24 C16,20 54,18 54,24"
        stroke={INK}
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      {/* Sleeve band */}
      <path
        d="M22,48 C22,46 48,44 48,48"
        stroke={INK}
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.3"
        fill="none"
      />
      <path
        d="M24,58 C24,56 46,54 46,58"
        stroke={INK}
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.3"
        fill="none"
      />
      {/* Steam */}
      <path
        d="M30,18 C28,10 32,6 30,0"
        stroke={INK}
        strokeWidth="1.8"
        strokeLinecap="round"
        opacity="0.15"
      />
      <path
        d="M40,16 C38,8 42,4 40,0"
        stroke={INK}
        strokeWidth="1.8"
        strokeLinecap="round"
        opacity="0.12"
      />
    </svg>
  );
}

/* ────────────────────────────────────────────
 * FOOD
 * ──────────────────────────────────────────── */

/** Croissant — quick loose sketch */
export function InkCroissant({ className = "", size = 80 }: IllustrationProps) {
  return (
    <svg
      width={size}
      height={size * 0.6}
      viewBox="0 0 80 48"
      fill="none"
      className={className}
    >
      <path
        d="M8,32 C12,20 20,12 30,10 C36,8 40,10 40,16 C40,10 44,8 50,10 C60,12 68,20 72,32 C68,36 52,38 40,38 C28,38 12,36 8,32Z"
        stroke={INK}
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      {/* Ridges */}
      <path
        d="M24,16 C28,20 32,28 30,34"
        stroke={INK}
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.3"
      />
      <path
        d="M56,16 C52,20 48,28 50,34"
        stroke={INK}
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.3"
      />
    </svg>
  );
}

/* ────────────────────────────────────────────
 * DECORATIVE & UI
 * ──────────────────────────────────────────── */

/** Small leaf — for accents and dividers */
export function InkLeaf({ className = "", size = 24 }: IllustrationProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
    >
      <path
        d="M12,2 C6,8 4,16 12,22 C20,16 18,8 12,2Z"
        stroke={INK}
        strokeWidth="1.8"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M12,6 C12,10 12,14 12,18"
        stroke={INK}
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.4"
      />
      <path
        d="M9,10 L12,12 L15,10"
        stroke={INK}
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.3"
      />
    </svg>
  );
}

/** Coffee bean */
export function InkBean({ className = "", size = 20 }: IllustrationProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 24"
      fill="none"
      className={className}
    >
      <path
        d="M10,2 C4,4 2,10 4,16 C6,22 14,22 16,16 C18,10 16,4 10,2Z"
        stroke={INK}
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M8,6 C10,10 10,14 8,18"
        stroke={INK}
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.4"
      />
    </svg>
  );
}

/** Star — hand-drawn, wobbly */
export function InkStar({ className = "", size = 20 }: IllustrationProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
    >
      <path
        d="M12,2 L14,9 L22,10 L16,15 L18,22 L12,18 L6,22 L8,15 L2,10 L10,9Z"
        stroke={INK}
        strokeWidth="1.8"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

/** Camera icon — for instagrammable badge */
export function InkCamera({ className = "", size = 24 }: IllustrationProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 24"
      fill="none"
      className={className}
    >
      <path
        d="M4,8 L4,20 C4,21 5,22 6,22 L22,22 C23,22 24,21 24,20 L24,8 C24,7 23,6 22,6 L18,6 L16,3 L12,3 L10,6 L6,6 C5,6 4,7 4,8Z"
        stroke={INK}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <circle cx="14" cy="14" r="4" stroke={INK} strokeWidth="2" fill="none" />
    </svg>
  );
}

/** Wifi icon — for workability */
export function InkWifi({ className = "", size = 24 }: IllustrationProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
    >
      <path
        d="M2,8 C6,4 10,2 12,2 C14,2 18,4 22,8"
        stroke={INK}
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M6,12 C8,10 10,9 12,9 C14,9 16,10 18,12"
        stroke={INK}
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M9,16 C10,15 11,14.5 12,14.5 C13,14.5 14,15 15,16"
        stroke={INK}
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="12" cy="20" r="1.5" fill={INK} />
    </svg>
  );
}

/** Plug/charging icon */
export function InkPlug({ className = "", size = 24 }: IllustrationProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
    >
      <path d="M8,2 L8,8" stroke={INK} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M16,2 L16,8" stroke={INK} strokeWidth="2.5" strokeLinecap="round" />
      <path
        d="M6,8 L18,8 L18,14 C18,18 15,20 12,20 C9,20 6,18 6,14Z"
        stroke={INK}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path d="M12,20 L12,24" stroke={INK} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/** Heart — loose, hand-drawn */
export function InkHeart({ className = "", size = 24 }: IllustrationProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
    >
      <path
        d="M12,21 C12,21 3,15 3,8 C3,5 5,3 8,3 C10,3 11.5,4 12,5 C12.5,4 14,3 16,3 C19,3 21,5 21,8 C21,15 12,21 12,21Z"
        stroke={INK}
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

/* ────────────────────────────────────────────
 * DIVIDERS
 * ──────────────────────────────────────────── */

// Canonical InkDivider lives in components/ui/InkDivider.tsx
export { default as InkDivider } from "@/components/ui/InkDivider";

/** Scribble divider — more playful, like a quick pen test */
export function InkScribbleDivider({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 12"
      fill="none"
      className={`w-32 ${className}`}
    >
      <path
        d="M0,6 C10,2 20,10 30,6 C40,2 50,10 60,6 C70,2 80,10 90,6 C100,2 110,10 120,6 C130,2 140,10 150,6 C160,2 170,10 180,6 C190,2 200,10 200,6"
        stroke={INK}
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.2"
        fill="none"
      />
    </svg>
  );
}

/** Three beans divider — cute section break */
export function InkBeanDivider({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-3 ${className}`}>
      <InkBean size={12} className="opacity-20 rotate-[-15deg]" />
      <InkBean size={14} className="opacity-25" />
      <InkBean size={12} className="opacity-20 rotate-[15deg]" />
    </div>
  );
}

/* ────────────────────────────────────────────
 * SCENES / COMPOSITIONS
 * ──────────────────────────────────────────── */

/** Cafe table scene — cup + croissant + plant, like inspo-1 */
export function InkCafeScene({
  className = "",
  size = 320,
}: IllustrationProps) {
  return (
    <svg
      width={size}
      height={size * 0.65}
      viewBox="0 0 320 210"
      fill="none"
      className={className}
    >
      {/* Table surface — loose line */}
      <path
        d="M20,170 C60,168 160,166 300,170"
        stroke={INK}
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.3"
      />

      {/* Cup — left side */}
      <g transform="translate(40, 80)">
        <path
          d="M0,20 C-2,22 -4,50 -2,58 C0,66 48,68 50,58 C52,48 50,22 48,20"
          stroke={INK}
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M-2,20 C-2,16 50,14 50,20"
          stroke={INK}
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M50,28 C58,26 64,32 64,40 C64,48 58,52 50,50"
          stroke={INK}
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
        {/* Saucer */}
        <path
          d="M-12,70 C-12,66 62,64 62,70"
          stroke={INK}
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
        {/* Steam */}
        <path d="M14,14 C12,4 16,-2 14,-8" stroke={INK} strokeWidth="1.8" strokeLinecap="round" opacity="0.15" />
        <path d="M28,12 C26,2 30,-4 28,-10" stroke={INK} strokeWidth="1.8" strokeLinecap="round" opacity="0.12" />
      </g>

      {/* Croissant — right of cup */}
      <g transform="translate(150, 130)">
        <path
          d="M0,20 C4,8 12,2 22,0 C28,-2 32,0 32,6 C32,0 36,-2 42,0 C52,2 60,8 64,20 C60,24 44,26 32,26 C20,26 4,24 0,20Z"
          stroke={INK}
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
        <path d="M18,4 C20,10 22,18 20,24" stroke={INK} strokeWidth="1.2" strokeLinecap="round" opacity="0.25" />
        <path d="M46,4 C44,10 42,18 44,24" stroke={INK} strokeWidth="1.2" strokeLinecap="round" opacity="0.25" />
      </g>

      {/* Small plant in pot — right side */}
      <g transform="translate(240, 50)">
        {/* Pot */}
        <path
          d="M10,60 C8,62 6,80 8,84 C10,88 38,88 40,84 C42,80 40,62 38,60"
          stroke={INK}
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M8,60 C8,56 40,56 40,60"
          stroke={INK}
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
        {/* Stems & leaves */}
        <path d="M24,56 C24,40 20,30 16,20" stroke={INK} strokeWidth="2" strokeLinecap="round" fill="none" />
        <path d="M16,20 C10,16 8,22 14,24 C16,22 16,20 16,20Z" stroke={INK} strokeWidth="1.5" strokeLinecap="round" fill="none" />
        <path d="M22,42 C18,34 22,24 28,16" stroke={INK} strokeWidth="2" strokeLinecap="round" fill="none" />
        <path d="M28,16 C34,12 36,18 30,20 C28,18 28,16 28,16Z" stroke={INK} strokeWidth="1.5" strokeLinecap="round" fill="none" />
        <path d="M26,48 C30,38 36,32 40,28" stroke={INK} strokeWidth="1.8" strokeLinecap="round" fill="none" />
        <path d="M40,28 C46,26 44,32 40,32 C40,30 40,28 40,28Z" stroke={INK} strokeWidth="1.5" strokeLinecap="round" fill="none" />
      </g>

      {/* Scattered beans — like crumbs on the table */}
      <g opacity="0.2">
        <ellipse cx="140" cy="168" rx="3" ry="4" stroke={INK} strokeWidth="1.2" transform="rotate(-20 140 168)" fill="none" />
        <ellipse cx="200" cy="172" rx="2.5" ry="3.5" stroke={INK} strokeWidth="1.2" transform="rotate(15 200 172)" fill="none" />
      </g>
    </svg>
  );
}

/** Stacked cups — like inspo-4 (Pause), bold and chunky */
export function InkStackedCups({
  className = "",
  size = 160,
}: IllustrationProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 160 160"
      fill="none"
      className={className}
    >
      {/* Bottom cup — largest */}
      <path
        d="M30,100 C28,102 24,130 28,136 C32,142 96,144 100,136 C104,128 100,102 98,100"
        stroke={INK}
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M28,100 C28,96 100,94 100,100"
        stroke={INK}
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M100,108 C110,106 116,112 116,120 C116,128 110,132 100,130"
        stroke={INK}
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />

      {/* Middle cup — smaller, stacked at angle */}
      <g transform="translate(15, -15) rotate(-5 64 80)">
        <path
          d="M36,68 C34,70 32,90 34,94 C36,98 86,100 88,94 C90,88 88,70 86,68"
          stroke={INK}
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M34,68 C34,64 88,62 88,68"
          stroke={INK}
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
      </g>

      {/* Top bowl — small, upside-down-ish */}
      <g transform="translate(25, -20)">
        <path
          d="M40,44 C36,48 34,60 38,64 C42,68 72,68 76,64 C80,60 78,48 74,44"
          stroke={INK}
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M38,44 C38,40 76,38 76,44"
          stroke={INK}
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
      </g>

      {/* Steam from the chaos */}
      <path d="M70,18 C68,10 72,4 70,0" stroke={INK} strokeWidth="2" strokeLinecap="round" opacity="0.15" />
      <path d="M82,20 C80,12 84,6 82,0" stroke={INK} strokeWidth="2" strokeLinecap="round" opacity="0.1" />
    </svg>
  );
}
