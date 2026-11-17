import { notFound } from "next/navigation";
import { getReviewById } from "@/lib/supabase/queries";
import ReviewEditForm from "./ReviewEditForm";

export default async function ReviewEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const review = await getReviewById(id);
  if (!review) notFound();

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <ReviewEditForm review={review} />
    </main>
  );
}
