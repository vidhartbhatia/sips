// design-rules: enforced
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import { ReviewArticle } from "@/components/review/ReviewArticle";
import { buildReviewPage } from "@/lib/review-view";
import { getCafeBySlug } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

interface CafePageProps {
  params: Promise<{ slug: string }>;
}

/** One read (and one round of photo signing) per request, shared by the metadata and the page. */
const loadReviewPage = cache(async (slug: string) => {
  const data = await getCafeBySlug(slug);
  if (!data) return null;
  return buildReviewPage({ cafe: data, reviews: data.reviews, items: data.items, photos: data.photos });
});

export async function generateMetadata({ params }: CafePageProps): Promise<Metadata> {
  const { slug } = await params;
  const view = await loadReviewPage(slug);
  if (!view) return {};
  // No OG image: photo URLs are signed and expire.
  return { title: view.cafe.name, description: view.lead.verdict ?? undefined };
}

/** The public review page (layout A). Only cafes with a published review get here. */
export default async function CafePage({ params }: CafePageProps) {
  const { slug } = await params;
  const view = await loadReviewPage(slug);
  if (!view) notFound();

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <ReviewArticle view={view} />
      </main>
      <Footer />
    </div>
  );
}
