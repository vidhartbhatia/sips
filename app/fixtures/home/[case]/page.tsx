// design-rules: enforced
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HomeView } from "@/components/home/HomeView";
import { fixturesEnabled } from "@/lib/fixtures";
import { fixtureListing, isFixtureCase } from "../fixture-data";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { robots: { index: false, follow: false } };

/** The home page with 0, 1, 2 or 6 made-up cafes: `/fixtures/home/{empty,one,two,six}`. */
export default async function HomeFixture({ params }: { params: Promise<{ case: string }> }) {
  if (!fixturesEnabled()) notFound();
  const { case: c } = await params;
  if (!isFixtureCase(c)) notFound();

  const { cafes, summaries } = fixtureListing(c);
  return <HomeView cafes={cafes} summaries={summaries} />;
}
