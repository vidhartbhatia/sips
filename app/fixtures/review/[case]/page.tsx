// design-rules: enforced
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import { ReviewArticle } from "@/components/review/ReviewArticle";
import { fixturesEnabled } from "@/lib/fixtures";
import { buildReviewPage } from "@/lib/review-view";
import { cases } from "../cases";

// Per request, so `fixturesEnabled()` is never baked in at build time.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { robots: { index: false } };

/** Test-only review pages from made-up data (e2e/review.spec.ts). 404 unless SIPS_FIXTURES=1. */
export default async function ReviewFixturePage({ params }: { params: Promise<{ case: string }> }) {
  if (!fixturesEnabled()) notFound();
  const { case: name } = await params;
  const input = Object.hasOwn(cases, name) ? cases[name] : null;
  const view = input ? buildReviewPage(input) : null;
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
