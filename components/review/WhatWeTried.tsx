// design-rules: enforced
import Image from "next/image";
import { Illustration } from "@/components/ui/Illustration";
import { ScoreNumeral } from "@/components/ui/Score";
import { DOODLES } from "@/lib/illustrations";
import type { VisitDrink } from "@/lib/review-view";

interface WhatWeTriedProps {
  drinks: VisitDrink[];
  unoptimizedImages: boolean;
  /** The lead visit uses h2; an earlier visit, nested under "Earlier visits", uses a smaller h3. */
  headingLevel?: 2 | 3;
  testId?: string;
}

const hasPicture = (drink: VisitDrink) => drink.photo !== null || (drink.doodle !== null && !!DOODLES[drink.doodle]);

/** Drawn heart, decorative: the sr-only "favourite" beside it carries the meaning. */
function FavouriteMark() {
  return (
    <>
      <svg
        viewBox="0 0 16 16"
        aria-hidden="true"
        focusable="false"
        className="h-3.5 w-3.5 shrink-0 text-terracotta-dark"
        fill="currentColor"
      >
        <path d="M8 14.2S1.8 10.4 1.8 6.1A3.3 3.3 0 0 1 8 4.5a3.3 3.3 0 0 1 6.2 1.6c0 4.3-6.2 8.1-6.2 8.1Z" />
      </svg>
      <span className="sr-only">favourite</span>
    </>
  );
}

function DrinkPicture({ drink, unoptimizedImages }: { drink: VisitDrink; unoptimizedImages: boolean }) {
  if (drink.photo) {
    return (
      <div className="relative aspect-[4/5] w-24 shrink-0 overflow-hidden rounded-md bg-stone sm:w-28">
        <Image
          src={drink.photo.url}
          alt={drink.photo.alt}
          fill
          sizes="112px"
          className="object-cover"
          unoptimized={unoptimizedImages}
        />
      </div>
    );
  }
  // Until the doodle set lands (K1) most slots are empty; render nothing, never an empty frame.
  if (hasPicture(drink) && drink.doodle) {
    return (
      <div className="flex w-24 shrink-0 items-start justify-center pt-1 sm:w-28">
        <Illustration slot={drink.doodle} className="h-16 w-16 text-espresso" />
      </div>
    );
  }
  return null;
}

/** "What we tried": one row per drink, with its photo (4:5), doodle or nothing. */
export function WhatWeTried({ drinks, unoptimizedImages, headingLevel = 2, testId }: WhatWeTriedProps) {
  if (drinks.length === 0) return null;
  const Heading = headingLevel === 2 ? "h2" : "h3";
  // From sm up, when any drink has a picture, the others keep its column empty so every
  // name lines up like a menu. On a phone the space is worth more than the alignment.
  const alignNames = drinks.some(hasPicture);

  return (
    <section data-testid={testId} className={headingLevel === 2 ? "mt-14" : "mt-6"}>
      <Heading
        className={`font-heading leading-none text-espresso ${headingLevel === 2 ? "text-4xl" : "text-2xl"}`}
      >
        What we tried
      </Heading>
      <ul className="mt-6 max-w-xl space-y-7">
        {drinks.map((drink) => (
          <li key={drink.id} className="flex items-start gap-4">
            {hasPicture(drink) ? (
              <DrinkPicture drink={drink} unoptimizedImages={unoptimizedImages} />
            ) : (
              alignNames && <div aria-hidden="true" className="hidden w-28 shrink-0 sm:block" />
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-3">
                <p className="flex min-w-0 items-center gap-1.5 font-semibold text-espresso">
                  <span className="break-words">{drink.name}</span>
                  {drink.isFavorite && <FavouriteMark />}
                </p>
                {drink.rating !== null && <ScoreNumeral value={drink.rating} size="sm" />}
              </div>
              {drink.type && (
                <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.14em] text-espresso-muted">
                  {drink.type}
                </p>
              )}
              {drink.note && <p className="mt-2 text-sm leading-relaxed text-espresso-muted">{drink.note}</p>}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
