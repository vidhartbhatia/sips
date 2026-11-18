// design-rules: enforced
import Image from "next/image";
import Link from "next/link";
import { ScoreNumeral } from "@/components/ui/Score";

export interface CardCafe {
  id: string;
  name: string;
  slug: string;
  neighborhood: string;
  overall_rating: number | null;
  /** A signed URL, or null when the cafe has no public cover. */
  cover_photo_url: string | null;
}

export interface CardSummary {
  verdict: string | null;
  visits: number;
}

interface CafeCardProps {
  cafe: Omit<CardCafe, "id">;
  summary?: CardSummary;
  variant: "grid" | "featured";
}

const SIZES = {
  grid: "(min-width: 1024px) 352px, (min-width: 640px) 50vw, 100vw",
  featured: "(min-width: 768px) 640px, 100vw",
} as const;

/**
 * One reviewed cafe. The whole card is a single link. No cover means no image area at all:
 * the card is text only, never a placeholder box.
 */
export function CafeCard({ cafe, summary, variant }: CafeCardProps) {
  const featured = variant === "featured";
  const hasCover = cafe.cover_photo_url !== null;

  return (
    <Link
      href={`/cafes/${cafe.slug}`}
      className={`group block rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-terracotta-dark ${
        featured && hasCover ? "md:grid md:grid-cols-[3fr_2fr] md:items-center md:gap-10" : ""
      }`}
    >
      {cafe.cover_photo_url && (
        <div className="relative aspect-[3/2] overflow-hidden rounded-lg bg-stone">
          <Image
            src={cafe.cover_photo_url}
            alt=""
            fill
            sizes={SIZES[variant]}
            className="object-cover transition-transform duration-300 group-hover:scale-[1.02] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          />
        </div>
      )}

      <div className={hasCover ? (featured ? "mt-4 md:mt-0" : "mt-4") : ""}>
        <h3
          className={`font-heading leading-tight text-espresso transition-colors group-hover:text-terracotta-dark ${
            featured ? "text-4xl" : "text-3xl"
          }`}
        >
          {cafe.name}
        </h3>
        <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.2em] text-espresso-muted">
          {cafe.neighborhood}
        </p>
        {cafe.overall_rating !== null && (
          <p className="mt-2">
            <ScoreNumeral value={cafe.overall_rating} visits={summary?.visits} size="sm" />
          </p>
        )}
        {summary?.verdict && (
          <p
            className={`mt-3 line-clamp-2 font-display italic leading-snug text-espresso ${
              featured ? "text-2xl" : "text-xl"
            }`}
          >
            {summary.verdict}
          </p>
        )}
      </div>
    </Link>
  );
}
