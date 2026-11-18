// design-rules: enforced
import { CafesView } from "@/components/cafes/CafesView";
import { getCafes, getVisitSummaries } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

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
