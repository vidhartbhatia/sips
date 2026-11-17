"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { SipsCup, SipsLabel } from "@/components/ui/SipsRating";
import { updateReview, publishReview } from "@/lib/actions/reviews";
import { deleteReview } from "@/lib/actions/admin";

interface ReviewEditFormProps {
  review: {
    id: string;
    cafe_id: string;
    overall_rating: number;
    note: string;
    date_visited: string;
    status: string;
    cafes: { name: string; slug: string; neighborhood: string } | null;
    items: Array<{
      id: string;
      name: string;
      type: string;
      rating: number;
      is_favorite: boolean;
      notes?: string | null;
    }>;
    photos: Array<{ id: string; photo_url: string }>;
  };
}

export default function ReviewEditForm({ review }: ReviewEditFormProps) {
  const router = useRouter();
  const [rating, setRating] = useState(review.overall_rating);
  const [note, setNote] = useState(review.note ?? "");
  const [dateVisited, setDateVisited] = useState(review.date_visited);
  const [status, setStatus] = useState(review.status);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const inputClass =
    "w-full rounded-lg border border-espresso/[0.12] bg-cream px-3 py-2.5 text-espresso placeholder:text-espresso-muted/50 focus:border-terracotta focus:outline-none focus:ring-1 focus:ring-terracotta/30";

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const result = await updateReview(review.id, {
      overall_rating: rating,
      note,
      date_visited: dateVisited,
      status: status as "draft" | "published",
    });

    if (result.error) {
      setError(result.error);
      setSaving(false);
    } else {
      router.push("/admin");
    }
  }

  async function handlePublish() {
    setSaving(true);
    const result = await publishReview(review.id);
    if (result.error) {
      setError(result.error);
      setSaving(false);
    } else {
      router.push("/admin");
    }
  }

  async function handleDelete() {
    setDeleting(true);
    await deleteReview(review.id);
  }

  return (
    <>
      <Link
        href="/admin"
        className="mb-2 inline-block text-sm text-espresso-muted hover:text-terracotta"
      >
        &larr; Dashboard
      </Link>
      <h1 className="font-heading text-4xl text-espresso">Edit Review</h1>
      <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-espresso-muted">
        {review.cafes?.name ?? "Unknown cafe"} &middot; {review.cafes?.neighborhood}
      </p>

      <form onSubmit={handleSave} className="mt-8 space-y-6">
        {/* Rating */}
        <div>
          <label className="mb-2 block font-mono text-[11px] uppercase tracking-[0.2em] text-espresso-muted">
            Rating
          </label>
          <div className="flex items-center gap-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <button
                key={i}
                type="button"
                onClick={() => setRating(i)}
                className={`transition-all ${
                  i <= rating
                    ? "scale-100 opacity-100"
                    : "scale-90 opacity-30 hover:opacity-60"
                }`}
              >
                <SipsCup sips={i} size={40} compact />
              </button>
            ))}
            <SipsLabel sips={rating} className="ml-2 text-base" />
          </div>
        </div>

        {/* Note */}
        <div>
          <label className="mb-1 block font-mono text-[11px] uppercase tracking-[0.2em] text-espresso-muted">
            Note
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={5}
            className={`${inputClass} resize-y`}
          />
        </div>

        {/* Date */}
        <div>
          <label className="mb-1 block font-mono text-[11px] uppercase tracking-[0.2em] text-espresso-muted">
            Date Visited
          </label>
          <input
            type="date"
            value={dateVisited}
            onChange={(e) => setDateVisited(e.target.value)}
            className={`${inputClass} max-w-xs`}
          />
        </div>

        {/* Status */}
        <div>
          <label className="mb-2 block font-mono text-[11px] uppercase tracking-[0.2em] text-espresso-muted">
            Status
          </label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStatus("draft")}
              className={`rounded-xl border px-4 py-2 text-sm transition-colors ${
                status === "draft"
                  ? "border-terracotta bg-terracotta/10 text-terracotta"
                  : "border-espresso/[0.1] text-espresso-muted hover:border-espresso/20"
              }`}
            >
              Draft
            </button>
            <button
              type="button"
              onClick={() => setStatus("published")}
              className={`rounded-xl border px-4 py-2 text-sm transition-colors ${
                status === "published"
                  ? "border-sage bg-sage/20 text-sage"
                  : "border-espresso/[0.1] text-espresso-muted hover:border-espresso/20"
              }`}
            >
              Published
            </button>
          </div>
        </div>

        {/* Items (read-only for now) */}
        {review.items && review.items.length > 0 && (
          <div>
            <label className="mb-2 block font-mono text-[11px] uppercase tracking-[0.2em] text-espresso-muted">
              Items
            </label>
            <div className="space-y-2">
              {review.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-lg border border-espresso/[0.08] p-3"
                >
                  <div className="flex items-center gap-2">
                    {item.is_favorite && (
                      <span className="text-terracotta">&hearts;</span>
                    )}
                    <span className="text-sm text-espresso">{item.name}</span>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-espresso-muted">
                      {item.type}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <SipsCup key={i} sips={i <= item.rating ? 5 : 1} size={16} compact />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Photos */}
        {review.photos && review.photos.length > 0 && (
          <div>
            <label className="mb-2 block font-mono text-[11px] uppercase tracking-[0.2em] text-espresso-muted">
              Photos
            </label>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {review.photos.map((photo) => (
                <div key={photo.id} className="relative aspect-square overflow-hidden rounded-xl">
                  <Image
                    src={photo.photo_url}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="150px"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-terracotta/20 bg-terracotta/5 p-3 text-center text-sm text-terracotta">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-terracotta px-6 py-3 text-sm font-medium text-cream transition-colors hover:bg-terracotta-dark disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
          {status === "draft" && (
            <button
              type="button"
              onClick={handlePublish}
              disabled={saving}
              className="rounded-xl bg-sage px-6 py-3 text-sm font-medium text-cream transition-colors hover:bg-sage/80 disabled:opacity-50"
            >
              Publish
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="rounded-xl border border-terracotta/20 px-6 py-3 text-sm text-terracotta transition-colors hover:bg-terracotta/5"
          >
            Delete
          </button>
        </div>
      </form>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-espresso/40 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-sm rounded-2xl border border-espresso/[0.08] bg-cream p-6">
            <h3 className="font-heading text-2xl text-espresso">Delete review?</h3>
            <p className="mt-2 text-sm text-espresso-muted">
              This will permanently delete this review and its photos.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="flex-1 rounded-xl border border-espresso/[0.12] py-3 text-sm text-espresso transition-colors hover:bg-stone"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 rounded-xl bg-terracotta py-3 text-sm text-cream transition-colors hover:bg-terracotta-dark disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
