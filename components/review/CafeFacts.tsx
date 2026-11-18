// design-rules: enforced
import Link from "next/link";
import type { ReviewPageView } from "@/lib/review-view";

interface CafeFactsProps {
  cafe: ReviewPageView["cafe"];
  featuredIn: { slug: string; title: string }[];
}

const LINK = "text-terracotta-dark underline decoration-1 underline-offset-4 hover:decoration-2";

/** Tags, the address with a Maps link, and the Stories this cafe appears in. */
export function CafeFacts({ cafe, featuredIn }: CafeFactsProps) {
  return (
    <div data-testid="cafe-facts" className="space-y-4">
      {cafe.tags.length > 0 && (
        <ul
          aria-label="Tags"
          className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs uppercase tracking-[0.14em] text-espresso-muted"
        >
          {cafe.tags.map((tag) => (
            <li key={tag}>{tag}</li>
          ))}
        </ul>
      )}

      {cafe.address.trim() && (
        <p className="text-base text-espresso">
          <a href={cafe.mapsUrl} target="_blank" rel="noopener noreferrer" className={LINK}>
            {cafe.address}
            <span className="sr-only"> (opens Google Maps)</span>
          </a>
        </p>
      )}

      {featuredIn.length > 0 && (
        <section aria-labelledby="featured-in-heading" className="pt-4">
          <h2 id="featured-in-heading" className="font-heading text-3xl leading-none text-espresso">
            Featured in
          </h2>
          <ul className="mt-3 space-y-1.5">
            {featuredIn.map((story) => (
              <li key={story.slug}>
                <Link href={`/stories/${story.slug}`} className={LINK}>
                  {story.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
