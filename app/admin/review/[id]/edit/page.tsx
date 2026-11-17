// design-rules: enforced
import { notFound } from "next/navigation";
import { getReviewById } from "@/lib/supabase/queries";
import ReviewEditForm from "./ReviewEditForm";

const oldestFirst = (a: { created_at: string }, b: { created_at: string }) =>
  a.created_at.localeCompare(b.created_at);

export default async function ReviewEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const review = await getReviewById(id);
  if (!review) notFound();

  return (
    <main className="mx-auto min-h-screen max-w-2xl bg-cream px-5 pt-6">
      <ReviewEditForm
        review={{
          id: review.id,
          status: review.status,
          overall_rating: review.overall_rating,
          verdict: review.verdict,
          note: review.note,
          date_visited: review.date_visited,
          cover_photo_id: review.cover_photo_id,
          cafe: review.cafes ? { name: review.cafes.name, neighborhood: review.cafes.neighborhood } : null,
          items: [...(review.items ?? [])].sort(oldestFirst).map((item) => ({
            id: item.id,
            name: item.name,
            category: item.category,
            type: item.type,
            rating: item.rating,
            is_favorite: item.is_favorite,
            notes: item.notes,
          })),
          // Photos that failed to sign are already dropped by the query.
          photos: [...review.photos].sort(oldestFirst).map((photo) => ({
            id: photo.id,
            url: photo.photo_url,
            item_id: photo.item_id,
            caption: photo.caption,
          })),
        }}
      />
    </main>
  );
}
