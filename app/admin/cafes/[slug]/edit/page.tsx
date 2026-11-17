import { notFound } from "next/navigation";
import { getCafeBySlugAdmin } from "@/lib/supabase/queries";
import CafeEditForm from "./CafeEditForm";

export default async function CafeEditPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const cafe = await getCafeBySlugAdmin(slug);
  if (!cafe) notFound();

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <CafeEditForm cafe={cafe} />
    </main>
  );
}
