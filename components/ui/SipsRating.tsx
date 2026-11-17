"use client";

import { useId } from "react";

/* ============================================
   SipsRating — The "Sips" rating system

   More sips = fuller cup = loved it

   1 sip:  nearly empty, muted color — meh
   2 sips: 1/4 full, slightly warmer — it's okay
   3 sips: half full, a heart floats — pretty good
   4 sips: 3/4 full, hearts, warm glow — loved it
   5 sips: full to the brim, "yum!", hearts, sparkles — incredible
   ============================================ */

interface SipsCupProps {
  sips: number;
  size?: number;
  compact?: boolean;
}

export function SipsCup({ sips, size = 32, compact = false }: SipsCupProps) {
  // More sips = more full: 1 sip = 0% fill, 5 sips = 100% fill
  const fillPercent = (sips - 1) / 4;
  const isCompact = compact || size < 40;
  const cupTop = 32;
  const cupBottom = 82;
  const fillHeight = (cupBottom - cupTop) * fillPercent;
  const fillY = cupBottom - fillHeight;

  // Color gets warmer/richer as rating increases
  const cupColors = ["#B8A090", "#C4935B", "#C4835B", "#C4735B", "#A85540"];
  // Cafe averages come in half points (4.5): colour by the whole score below.
  const cupColor = cupColors[Math.min(Math.max(Math.floor(sips) - 1, 0), 4)];
  const annotColor = "#C4735B";
  const heartCount = Math.max(0, sips - 2);
  const showYum = sips === 5;
  const showMeh = sips === 1;
  const clipId = useId();

  return (
    <svg
      width={size}
      height={isCompact ? size : size * 1.25}
      viewBox={isCompact ? "10 25 90 75" : "0 0 100 125"}
      fill="none"
      role="img"
      aria-label={`${sips} out of 5 sips`}
    >
      <defs>
        <clipPath id={clipId}>
          <path d="M22,30 C21,32 17,82 20,88 C24,94 76,94 80,88 C83,82 79,32 78,30 Z" />
        </clipPath>
      </defs>

      {/* Hearts — large only */}
      {!isCompact && heartCount >= 1 && (
        <g opacity="0.5">
          <path d="M58,20 C60,16 64,16 64,20 C64,24 58,28 58,28 C58,28 52,24 52,20 C52,16 56,16 58,20Z" fill="#E8B4B8" />
        </g>
      )}
      {!isCompact && heartCount >= 2 && (
        <g opacity="0.4">
          <path d="M40,14 C41.5,11 44.5,11 44.5,14 C44.5,17 40,20 40,20 C40,20 35.5,17 35.5,14 C35.5,11 38.5,11 40,14Z" fill="#E8B4B8" />
        </g>
      )}
      {!isCompact && heartCount >= 3 && (
        <g opacity="0.35">
          <path d="M72,10 C73,8 75,8 75,10 C75,12 72,14 72,14 C72,14 69,12 69,10 C69,8 71,8 72,10Z" fill="#E8B4B8" />
        </g>
      )}

      {/* "yum!" for 5 sips — large only */}
      {!isCompact && showYum && (
        <text x="50" y="12" textAnchor="middle" fontFamily="'Caveat', cursive" fontSize="16" fontWeight="700" fill={annotColor}>
          yum!
        </text>
      )}

      {/* "meh" for 1 sip — large only */}
      {!isCompact && showMeh && (
        <text x="50" y="12" textAnchor="middle" fontFamily="'Caveat', cursive" fontSize="14" fontWeight="700" fill="#B8A090" opacity="0.6">
          meh
        </text>
      )}

      {/* Liquid fill */}
      {fillPercent > 0.02 && (
        <>
          <rect
            x="16" y={fillY} width="68" height={fillHeight + 10}
            fill={cupColor} opacity={0.15 + fillPercent * 0.2}
            clipPath={`url(#${clipId})`}
          />
          <path
            d={`M24,${fillY + 2} C38,${fillY - 1.5} 60,${fillY + 2.5} 76,${fillY}`}
            stroke={cupColor} strokeWidth="1.5" strokeLinecap="round" fill="none"
            opacity={0.3 + fillPercent * 0.3}
            clipPath={`url(#${clipId})`}
          />
        </>
      )}

      {/* Cup outline */}
      <path d="M22,30 C21,32 17,82 20,88 C24,94 76,94 80,88 C83,82 79,32 78,30" stroke={cupColor} strokeWidth="2.5" strokeLinecap="round" fill="none" />
      {/* Handle */}
      <path d="M78,40 C86,40 92,50 92,58 C92,66 86,76 78,76" stroke={cupColor} strokeWidth="2.5" strokeLinecap="round" fill="none" />
      {/* Rim */}
      <path d="M20,30 L80,30" stroke={cupColor} strokeWidth="2" strokeLinecap="round" />

      {/* Saucer — large only */}
      {!isCompact && sips >= 4 && (
        <path d="M12,96 C12,96 50,100 88,96" stroke={cupColor} strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.4" />
      )}

      {/* Sparkles for 5 sips — large only */}
      {!isCompact && sips === 5 && (
        <>
          <path d="M30,50 L26,46 M30,46 L26,50" stroke={annotColor} strokeWidth="1.2" strokeLinecap="round" opacity="0.3" />
          <path d="M68,55 L64,51 M68,51 L64,55" stroke={annotColor} strokeWidth="1.2" strokeLinecap="round" opacity="0.3" />
          <path d="M50,65 L47,62 M50,62 L47,65" stroke={annotColor} strokeWidth="1.2" strokeLinecap="round" opacity="0.25" />
        </>
      )}
    </svg>
  );
}

/* ============================================
   SipsLabel — text companion for compact cup
   Shows number + emotional cue at small sizes
   ============================================ */

/**
 * Text for a score: whole scores 1–5, or a cafe average in half points ("4.5 sips").
 * Anything else (null, 0, out of range) has no label.
 */
export function sipsLabel(sips: number | null | undefined): { text: string; extra?: string } | null {
  if (sips === null || sips === undefined || !Number.isFinite(sips)) return null;
  const halves = Math.round(sips * 2) / 2;
  if (halves < 1 || halves > 5) return null;
  const extras: Record<number, string> = { 1: "meh", 4: "\u2665", 5: "yum!" };
  return { text: `${halves} ${halves === 1 ? "sip" : "sips"}`, extra: extras[halves] };
}

interface SipsLabelProps {
  sips: number;
  className?: string;
}

export function SipsLabel({ sips, className = "" }: SipsLabelProps) {
  const label = sipsLabel(sips);
  // Never stand in a made-up score: no label for a missing or out-of-range value.
  if (!label) return null;

  return (
    <span className={`font-heading text-terracotta ${className}`}>
      {label.text}
      {label.extra && (
        <span className={`ml-1 ${sips <= 1 ? "text-espresso-muted" : "text-pink"}`}>{label.extra}</span>
      )}
    </span>
  );
}

/* ============================================
   SipsRating — Combined cup + label
   Convenience wrapper for the common pattern
   ============================================ */

interface SipsRatingProps {
  sips: number;
  size?: number;
  showLabel?: boolean;
  labelClassName?: string;
}

export default function SipsRating({
  sips,
  size = 28,
  showLabel = true,
  labelClassName = "text-sm",
}: SipsRatingProps) {
  return (
    <div className="flex items-center gap-2">
      <SipsCup sips={sips} size={size} />
      {showLabel && <SipsLabel sips={sips} className={labelClassName} />}
    </div>
  );
}
