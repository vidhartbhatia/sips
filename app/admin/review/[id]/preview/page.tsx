// design-rules: enforced
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import { PreviewBanner } from "@/components/review/PreviewBanner";
import { ReviewArticle } from "@/components/review/ReviewArticle";
import { requireAuth } from "@/lib/auth";
import { buildReviewPage, publishBlocker } from "@/lib/review-view";
import { getReviewPreview } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Preview", robots: { index: false, follow: false } };

/** The review page as it will look once published, for any review (draft or published). */
export default async function ReviewPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  // proxy.ts already redirects logged-out visitors to /login; this is defence in depth.
  await requireAuth();
  const { id } = await params;

  const preview = await getReviewPreview(id);
  if (!preview) notFound();
  const view = buildReviewPage(preview.input, { leadVisitId: preview.leadVisitId });
  if (!view) notFound();

  const isDraft = view.lead.status === "draft";
  const blocker = publishBlocker(preview.input, preview.leadVisitId);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <ReviewArticle
          view={view}
          unoptimizedImages
          banner={<PreviewBanner reviewId={id} isDraft={isDraft} blocker={blocker} />}
        />
      </main>
      <Footer />
    </div>
  );
}
