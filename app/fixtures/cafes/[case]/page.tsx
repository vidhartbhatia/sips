// design-rules: enforced
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CafesView } from "@/components/cafes/CafesView";
import { fixturesEnabled } from "@/lib/fixtures";
import { fixtureListing, isFixtureCase } from "../../home/fixture-data";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { robots: { index: false, follow: false } };

/** `/cafes` with 0, 1, 2 or 6 made-up cafes: `/fixtures/cafes/{empty,one,two,six}`. */
export default async function CafesFixture({ params }: { params: Promise<{ case: string }> }) {
  if (!fixturesEnabled()) notFound();
  const { case: c } = await params;
  if (!isFixtureCase(c)) notFound();

  const { cafes, summaries } = fixtureListing(c);
  return <CafesView cafes={cafes} summaries={summaries} />;
}
