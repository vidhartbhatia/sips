// design-rules: enforced
import Image from "next/image";
import type { VisitPhoto } from "@/lib/review-view";

interface PhotoStripProps {
  photos: VisitPhoto[];
  unoptimizedImages: boolean;
  testId?: string;
  /** Inside an earlier visit: tighter spacing. */
  compact?: boolean;
}

/**
 * The visit's other photos, two to a row (portrait 4:5). An odd last photo takes the full
 * row at 3:2, so the grid never ends on a hole.
 */
export function PhotoStrip({ photos, unoptimizedImages, testId, compact = false }: PhotoStripProps) {
  if (photos.length === 0) return null;

  return (
    <ul data-testid={testId} aria-label="Photos" className={`grid grid-cols-2 gap-3 sm:gap-4 ${compact ? "mt-6" : "mt-12"}`}>
      {photos.map((photo, i) => {
        const wide = photos.length % 2 === 1 && i === photos.length - 1;
        return (
          <li
            key={photo.id}
            className={`relative overflow-hidden rounded-md bg-stone ${wide ? "col-span-2 aspect-[3/2]" : "aspect-[4/5]"}`}
          >
            <Image
              src={photo.url}
              alt={photo.alt}
              fill
              sizes={wide ? "(min-width: 768px) 720px, 100vw" : "(min-width: 768px) 360px, 50vw"}
              className="object-cover"
              unoptimized={unoptimizedImages}
            />
          </li>
        );
      })}
    </ul>
  );
}
