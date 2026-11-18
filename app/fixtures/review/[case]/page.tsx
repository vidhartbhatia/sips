// design-rules: enforced
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import { PreviewBanner } from "@/components/review/PreviewBanner";
import { ReviewArticle } from "@/components/review/ReviewArticle";
import { JsonLd } from "@/components/seo/JsonLd";
import { fixturesEnabled } from "@/lib/fixtures";
import { publishBlocker } from "@/lib/review-view";
import { cafeJsonLd, cafeMetadata, NOINDEX } from "@/lib/seo";
import { featuredIn, FIXTURE_GEO, loadFixture } from "../cases";

// Per request, so `fixturesEnabled()` is never baked in at build time.
export const dynamic = "force-dynamic";

interface ReviewFixturePageProps {
  params: Promise<{ case: string }>;
}

/** The same metadata as the real cafe page (lib/seo.ts), kept out of search. e2e/seo.spec.ts reads it. */
export async function generateMetadata({ params }: ReviewFixturePageProps): Promise<Metadata> {
  const { case: name } = await params;
  const fixture = fixturesEnabled() ? loadFixture(name) : null;
  return { ...(fixture && cafeMetadata(fixture.view)), robots: NOINDEX };
}

/** Test-only review pages from made-up data (e2e/review.spec.ts). 404 unless SIPS_FIXTURES=1. */
export default async function ReviewFixturePage({ params }: ReviewFixturePageProps) {
  if (!fixturesEnabled()) notFound();
  const { case: name } = await params;
  const fixture = loadFixture(name);
  if (!fixture) notFound();
  const { input, view, leadVisitId } = fixture;

  // Preview cases get the admin banner, exactly as /admin/review/[id]/preview renders it.
  const banner = leadVisitId ? (
    <PreviewBanner
      reviewId={leadVisitId}
      isDraft={view.lead.status === "draft"}
      blocker={publishBlocker(input, leadVisitId)}
    />
  ) : undefined;

  return (
    <div className="flex min-h-screen flex-col">
      <JsonLd data={cafeJsonLd(view, FIXTURE_GEO)} />
      <Header />
      <main className="flex-1">
        <ReviewArticle
          view={view}
          banner={banner}
          featuredIn={Object.hasOwn(featuredIn, name) ? featuredIn[name] : []}
        />
      </main>
      <Footer />
    </div>
  );
}
