import { getCafes } from "@/lib/supabase/queries";
import HomeContent from "@/components/home/HomeContent";

export const dynamic = "force-dynamic";

export default async function Home() {
  const cafes = await getCafes({ status: "published", limit: 6 });

  const mapped = cafes.map((c: Record<string, unknown>) => ({
    name: c.name as string,
    slug: c.slug as string,
    neighborhood: c.neighborhood as string,
    overall_rating: c.overall_rating as number | null,
    vibe_tags: (c.vibe_tags ?? []) as string[],
    cover_photo_url: c.cover_photo_url as string | null,
  }));

  return <HomeContent cafes={mapped} />;
}
