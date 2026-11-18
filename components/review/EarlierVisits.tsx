// design-rules: enforced
import { ScoreNumeral } from "@/components/ui/Score";
import type { VisitView } from "@/lib/review-view";
import { PhotoStrip } from "./PhotoStrip";
import { VisitStory } from "./VisitStory";
import { WhatWeTried } from "./WhatWeTried";

interface EarlierVisitsProps {
  visits: VisitView[];
  unoptimizedImages: boolean;
}

function Chevron() {
  return (
    <svg
      viewBox="0 0 20 20"
      aria-hidden="true"
      focusable="false"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5 shrink-0 text-espresso-muted transition-transform duration-200 group-open:rotate-180 motion-reduce:transition-none"
    >
      <path d="m5 7.5 5 5 5-5" />
    </svg>
  );
}

/**
 * Earlier visits as native `<details>`: the summary holds the date, author, verdict, score
 * and drinks; opening it shows that visit's drinks, story and photos in place.
 */
export function EarlierVisits({ visits, unoptimizedImages }: EarlierVisitsProps) {
  if (visits.length === 0) return null;

  return (
    <section data-testid="earlier-visits" aria-labelledby="earlier-visits-heading">
      <h2 id="earlier-visits-heading" className="font-heading text-4xl leading-none text-espresso">
        Earlier visits
      </h2>
      <ul className="mt-6 border-t border-espresso/15">
        {visits.map((visit) => {
          const meta = [visit.monthYear, visit.author && `by ${visit.author}`].filter(Boolean).join(" · ");
          return (
            <li key={visit.id} className="border-b border-espresso/15">
              <details className="group">
                <summary className="flex cursor-pointer list-none items-start gap-4 rounded-sm py-5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-terracotta-dark [&::-webkit-details-marker]:hidden">
                  <span className="min-w-0 flex-1">
                    <span className="block font-mono text-xs uppercase tracking-[0.18em] text-espresso-muted">
                      {meta}
                    </span>
                    {visit.verdict && (
                      <span className="mt-1.5 block font-display text-xl leading-snug text-espresso italic">
                        {visit.verdict}
                      </span>
                    )}
                    {visit.drinks.length > 0 && (
                      <span className="mt-1.5 block text-sm text-espresso-muted">
                        {visit.drinks.map((d) => d.name).join(", ")}
                      </span>
                    )}
                  </span>
                  <span className="flex shrink-0 items-center gap-3 pt-0.5">
                    {visit.score !== null && <ScoreNumeral value={visit.score} size="sm" />}
                    <Chevron />
                  </span>
                </summary>
                <div className="pb-8">
                  <WhatWeTried drinks={visit.drinks} unoptimizedImages={unoptimizedImages} headingLevel={3} />
                  <VisitStory paragraphs={visit.paragraphs} compact />
                  {/* An earlier visit has no hero slot, so its hero leads its photos. */}
                  <PhotoStrip
                    photos={visit.hero ? [visit.hero, ...visit.strip] : visit.strip}
                    unoptimizedImages={unoptimizedImages}
                    compact
                  />
                </div>
              </details>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
