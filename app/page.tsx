// design-rules: enforced
import type { Metadata } from "next";
import { HomeView } from "@/components/home/HomeView";
import { JsonLd } from "@/components/seo/JsonLd";
import { getCafes, getVisitSummaries } from "@/lib/supabase/queries";
import { byLatestVisit } from "@/lib/listing";
import { pageMetadata, siteJsonLd } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = pageMetadata({ path: "/" });

const RECENT = 6;

export default async function Home() {
  // Every listed cafe (dozens at most for now), so "recent" means latest visit, not top score.
  const cafes = await getCafes();
  const summaries = await getVisitSummaries(cafes.map((c) => c.id));
  const recent = [...cafes].sort(byLatestVisit(summaries)).slice(0, RECENT);

  return (
    <>
      <JsonLd data={siteJsonLd()} />
      <HomeView cafes={recent} summaries={summaries} />
    </>
  );
}
