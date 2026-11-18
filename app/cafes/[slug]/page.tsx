// design-rules: enforced
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import { ReviewArticle } from "@/components/review/ReviewArticle";
import { JsonLd } from "@/components/seo/JsonLd";
import { getStoriesForCafe } from "@/lib/blog";
import { buildReviewPage } from "@/lib/review-view";
import { cafeJsonLd, cafeMetadata } from "@/lib/seo";
import { getCafeBySlug } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

interface CafePageProps {
  params: Promise<{ slug: string }>;
}

/** One read (and one round of photo signing) per request, shared by the metadata and the page. */
const loadReviewPage = cache(async (slug: string) => {
  const data = await getCafeBySlug(slug);
  if (!data) return null;
  const view = buildReviewPage({ cafe: data, reviews: data.reviews, items: data.items, photos: data.photos });
  return view ? { view, geo: { lat: data.lat, lng: data.lng } } : null;
});

export async function generateMetadata({ params }: CafePageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = await loadReviewPage(slug);
  // The share image is ./opengraph-image.tsx: it signs the hero photo itself, server-side.
  return page ? cafeMetadata(page.view) : {};
}

/** The public review page (layout A). Only cafes with a published review get here. */
export default async function CafePage({ params }: CafePageProps) {
  const { slug } = await params;
  const page = await loadReviewPage(slug);
  if (!page) notFound();

  return (
    <div className="flex min-h-screen flex-col">
      <JsonLd data={cafeJsonLd(page.view, page.geo)} />
      <Header />
      <main className="flex-1">
        <ReviewArticle view={page.view} featuredIn={await getStoriesForCafe(slug)} />
      </main>
      <Footer />
    </div>
  );
}
