// design-rules: enforced
import { HomeView } from "@/components/home/HomeView";
import { getCafes, getVisitSummaries } from "@/lib/supabase/queries";
import { byLatestVisit } from "@/lib/listing";

export const dynamic = "force-dynamic";

const RECENT = 6;

export default async function Home() {
  // Every listed cafe (dozens at most for now), so "recent" means latest visit, not top score.
  const cafes = await getCafes();
  const summaries = await getVisitSummaries(cafes.map((c) => c.id));
  const recent = [...cafes].sort(byLatestVisit(summaries)).slice(0, RECENT);

  return <HomeView cafes={recent} summaries={summaries} />;
}
