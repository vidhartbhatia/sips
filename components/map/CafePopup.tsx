import Link from "next/link";
import SipsRating from "@/components/ui/SipsRating";
import type { Cafe } from "@/lib/supabase/types";

interface CafePopupProps {
  cafe: Pick<Cafe, "name" | "slug" | "neighborhood" | "overall_rating" | "cover_photo_url">;
}

export default function CafePopup({ cafe }: CafePopupProps) {
  return (
    <div className="w-56 rounded-lg bg-cream p-3 shadow-lg">
      {cafe.cover_photo_url && (
        <div className="mb-2 aspect-[3/2] overflow-hidden rounded">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={cafe.cover_photo_url}
            alt={cafe.name}
            className="h-full w-full object-cover"
          />
        </div>
      )}
      <h3 className="font-heading text-base font-semibold text-espresso">
        {cafe.name}
      </h3>
      <p className="font-heading text-xs text-espresso-muted">{cafe.neighborhood}</p>
      {cafe.overall_rating && (
        <div className="mt-1">
          <SipsRating sips={Math.round(cafe.overall_rating)} size={22} />
        </div>
      )}
      <Link
        href={`/cafes/${cafe.slug}`}
        className="mt-2 inline-block font-heading text-sm text-terracotta hover:text-terracotta-dark"
      >
        read review &rarr;
      </Link>
    </div>
  );
}
