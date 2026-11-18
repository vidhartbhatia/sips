import { cafeCard, cafeImage, notFoundImage } from "@/lib/og";
import { buildReviewPage } from "@/lib/review-view";
import { getCafeBySlug } from "@/lib/supabase/queries";

export const alt = "A Sips cafe review card: the cafe's name, our verdict and our score";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

interface ImageProps {
  params: Promise<{ slug: string }>;
}

/**
 * The cafe page's share image. The same public read as the page (listed cafes, published
 * visits only); the hero photo's signed URL is fetched here, server-side, and only its pixels
 * reach the card. Unlisted cafes get a 404.
 */
export default async function Image({ params }: ImageProps): Promise<Response> {
  const { slug } = await params;
  const data = await getCafeBySlug(slug);
  const view = data && buildReviewPage({ cafe: data, reviews: data.reviews, items: data.items, photos: data.photos });
  if (!view) return notFoundImage();
  return cafeImage(cafeCard(view));
}
