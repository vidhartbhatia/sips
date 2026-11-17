import { notFound } from "next/navigation";
import { getCafeBySlug } from "@/lib/supabase/queries";
import CafeDetail from "@/components/cafes/CafeDetail";

export const dynamic = "force-dynamic";

export default async function CafeDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const cafe = await getCafeBySlug(slug);

  if (!cafe) {
    notFound();
  }

  return <CafeDetail cafe={cafe} />;
}
