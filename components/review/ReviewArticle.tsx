// design-rules: enforced
import type { ReactNode } from "react";
import InkDivider from "@/components/ui/InkDivider";
import type { ReviewPageView } from "@/lib/review-view";
import { CafeFacts } from "./CafeFacts";
import { EarlierVisits } from "./EarlierVisits";
import { PhotoStrip } from "./PhotoStrip";
import { VisitLead } from "./VisitLead";
import { VisitStory } from "./VisitStory";
import { WhatWeTried } from "./WhatWeTried";

interface ReviewArticleProps {
  view: ReviewPageView;
  /** Rendered above everything, e.g. the admin preview's draft banner. */
  banner?: ReactNode;
  featuredIn?: { slug: string; title: string }[];
  /** The admin preview signs URLs fresh on every render; optimizing them would spend quota. */
  unoptimizedImages?: boolean;
}

/**
 * The review page (layout A), one column at every width. Renders an `<article>`; the
 * caller owns `<main>`, the header and the footer. Server component, no motion: everything
 * is visible in the server HTML. Every section is left out, heading included, when empty.
 */
export function ReviewArticle({ view, banner, featuredIn = [], unoptimizedImages = false }: ReviewArticleProps) {
  const { lead } = view;
  const hasEarlier = view.earlier.length > 0;
  // Exactly one divider per page: before "Earlier visits", or before the facts without them.
  const divider = <InkDivider className="my-12 text-espresso" />;

  return (
    <article className="mx-auto w-full max-w-3xl px-5 pt-6 pb-20 sm:px-6 sm:pt-10">
      {banner}

      <VisitLead view={view} unoptimizedImages={unoptimizedImages} />

      <WhatWeTried drinks={lead.drinks} unoptimizedImages={unoptimizedImages} testId="what-we-tried" />
      <VisitStory paragraphs={lead.paragraphs} testId="review-story" />
      <PhotoStrip photos={lead.strip} unoptimizedImages={unoptimizedImages} testId="photo-strip" />

      {lead.author && (
        <p data-testid="review-byline" className="mt-10 font-heading text-3xl leading-none text-espresso-muted">
          — {lead.author}
        </p>
      )}

      {!hasEarlier && divider}
      <div className={hasEarlier ? "mt-10" : undefined}>
        <CafeFacts cafe={view.cafe} featuredIn={featuredIn} />
      </div>

      {hasEarlier && (
        <>
          {divider}
          <EarlierVisits visits={view.earlier} unoptimizedImages={unoptimizedImages} />
        </>
      )}
    </article>
  );
}
