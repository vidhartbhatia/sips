// design-rules: enforced
import Image from "next/image";
import { RatingGlyph, ScoreNumeral } from "@/components/ui/Score";
import type { ReviewPageView } from "@/lib/review-view";

interface VisitLeadProps {
  view: ReviewPageView;
  unoptimizedImages: boolean;
}

/** The top of the review page: hero, metadata line, cafe name, verdict and the cafe score. */
export function VisitLead({ view, unoptimizedImages }: VisitLeadProps) {
  const { lead, cafe, score } = view;
  const meta = [cafe.neighborhood.trim(), lead.monthYear, lead.author && `by ${lead.author}`].filter(
    (part): part is string => Boolean(part),
  );

  return (
    <header>
      {lead.hero && (
        <div
          data-testid="review-hero"
          className="relative -mx-5 aspect-[3/2] overflow-hidden bg-stone sm:mx-0 sm:rounded-lg"
        >
          <Image
            src={lead.hero.url}
            alt={lead.hero.alt}
            fill
            preload
            sizes="(min-width: 768px) 720px, 100vw"
            className="object-cover"
            unoptimized={unoptimizedImages}
          />
        </div>
      )}

      <p
        data-testid="review-meta"
        className={`font-mono text-xs uppercase tracking-[0.18em] text-espresso-muted ${lead.hero ? "mt-7" : ""}`}
      >
        {/* The month and "by Lea" stay whole; a long neighbourhood may still wrap inside itself. */}
        {meta.map((part, i) => (
          <span key={i}>
            {i > 0 && " · "}
            <span className={i > 0 ? "whitespace-nowrap" : undefined}>{part}</span>
          </span>
        ))}
      </p>

      <h1 className="mt-3 break-words font-heading text-5xl leading-[1.05] text-balance text-espresso sm:text-6xl">
        {cafe.name}
      </h1>

      {lead.verdict && (
        <p
          data-testid="review-verdict"
          className="mt-4 font-display text-2xl leading-snug text-pretty text-espresso italic sm:text-[1.875rem]"
        >
          {lead.verdict}
        </p>
      )}

      {score.value !== null && (
        <div data-testid="review-score" className="mt-7 flex items-center gap-3">
          <RatingGlyph className="h-10 w-10 shrink-0 text-espresso" />
          <ScoreNumeral value={score.value} visits={score.visits} size="lg" />
        </div>
      )}
    </header>
  );
}
