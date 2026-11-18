// design-rules: enforced
import type { Metadata } from "next";
import { CafesView } from "@/components/cafes/CafesView";
import { pageMetadata } from "@/lib/seo";
import { getCafes, getVisitSummaries } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = pageMetadata({
  title: "Cafes",
  description: "Every Seattle cafe we have reviewed, with our score and a one-line verdict.",
  path: "/cafes",
});

export default async function CafesPage() {
  // Only the card fields cross into the client grid.
  const cafes = (await getCafes()).map(({ id, name, slug, neighborhood, overall_rating, cover_photo_url }) => ({
    id,
    name,
    slug,
    neighborhood,
    overall_rating,
    cover_photo_url,
  }));
  const summaries = await getVisitSummaries(cafes.map((c) => c.id));

  return <CafesView cafes={cafes} summaries={summaries} />;
}
