"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import SipsRating from "@/components/ui/SipsRating";
import { updateCafe } from "@/lib/actions/cafes";
import { deleteCafe } from "@/lib/actions/admin";
import { NEIGHBORHOODS } from "@/lib/neighborhoods";


const VIBE_TAGS = [
  "cozy", "modern", "spacious", "bright", "dark", "loud", "quiet",
  "outdoor seating", "good wifi", "dog friendly",
];

interface CafeEditFormProps {
  cafe: {
    id: string;
    name: string;
    slug: string;
    address: string;
    neighborhood: string;
    overall_rating: number | null;
    vibe_tags: string[];
    cover_photo_url?: string | null;
    reviews: Array<{
      id: string;
      date_visited: string;
      overall_rating: number | null;
      note: string | null;
    }>;
    photos: Array<{ id: string; photo_url: string }>;
  };
}

export default function CafeEditForm({ cafe }: CafeEditFormProps) {
  const router = useRouter();
  const [name, setName] = useState(cafe.name);
  const [address, setAddress] = useState(cafe.address);
  const [neighborhood, setNeighborhood] = useState(cafe.neighborhood);
  const [vibeTags, setVibeTags] = useState<string[]>(cafe.vibe_tags ?? []);
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

    const result = await updateCafe(cafe.id, {
      name,
      address,
      neighborhood,
      vibe_tags: vibeTags,
    });

    if (result.error) {
      setError(result.error);
      setSaving(false);
    } else {
      router.push("/admin/cafes");
    }
  }

  async function handleDelete() {
    setDeleting(true);
    await deleteCafe(cafe.id);
  }

  function toggleTag(tag: string) {
    setVibeTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  return (
    <>
      <Link
        href="/admin/cafes"
        className="mb-2 inline-block text-sm text-espresso-muted hover:text-terracotta"
      >
        &larr; All Cafes
      </Link>
      <h1 className="font-heading text-4xl text-espresso">{cafe.name}</h1>
      <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-espresso-muted">
        editing cafe
      </p>

      <form onSubmit={handleSave} className="mt-8 space-y-6">
        {/* Name */}
        <div>
          <label className="mb-1 block font-mono text-[11px] uppercase tracking-[0.2em] text-espresso-muted">
            Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
            required
          />
        </div>

        {/* Address */}
        <div>
          <label className="mb-1 block font-mono text-[11px] uppercase tracking-[0.2em] text-espresso-muted">
            Address
          </label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className={inputClass}
          />
        </div>

        {/* Neighborhood */}
        <div>
          <label className="mb-1 block font-mono text-[11px] uppercase tracking-[0.2em] text-espresso-muted">
            Neighborhood
          </label>
          <select
            value={neighborhood}
            onChange={(e) => setNeighborhood(e.target.value)}
            className={`${inputClass} appearance-none`}
            required
          >
            <option value="" disabled>Select neighborhood</option>
            {NEIGHBORHOODS.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>

        {/* Vibe Tags */}
        <div>
          <label className="mb-2 block font-mono text-[11px] uppercase tracking-[0.2em] text-espresso-muted">
            Vibe Tags
          </label>
          <div className="flex flex-wrap gap-2">
            {VIBE_TAGS.map((tag) => {
              const active = vibeTags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                    active
                      ? "border-sage bg-sage/20 text-sage"
                      : "border-espresso/[0.1] text-espresso-muted hover:border-sage/30"
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>

        {/* Photos */}
        {cafe.photos && cafe.photos.length > 0 && (
          <div>
            <label className="mb-2 block font-mono text-[11px] uppercase tracking-[0.2em] text-espresso-muted">
              Photos
            </label>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {cafe.photos.map((photo) => (
                <div key={photo.id} className="relative aspect-square overflow-hidden rounded-xl">
                  <Image
                    src={photo.photo_url}
                    alt=""
                    fill
                    // Fresh signed URL each render: skip the optimizer so tokens don't burn its quota.
                    unoptimized
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
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-terracotta px-6 py-3 text-sm font-medium text-cream transition-colors hover:bg-terracotta-dark disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="rounded-xl border border-terracotta/20 px-6 py-3 text-sm text-terracotta transition-colors hover:bg-terracotta/5"
          >
            Delete Cafe
          </button>
        </div>
      </form>

      {/* Reviews for this cafe */}
      {cafe.reviews && cafe.reviews.length > 0 && (
        <div className="mt-12">
          <h2 className="font-heading text-2xl text-espresso">Reviews</h2>
          <div className="mt-4 space-y-3">
            {cafe.reviews.map((review) => (
              <Link
                key={review.id}
                href={`/admin/review/${review.id}/edit`}
                className="block rounded-xl border border-espresso/[0.08] bg-cream p-4 transition-colors hover:border-terracotta/20"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-espresso-muted">
                    visited {review.date_visited}
                  </span>
                  {review.overall_rating !== null && (
                    <SipsRating sips={review.overall_rating} size={20} />
                  )}
                </div>
                {review.note && (
                  <p className="mt-2 line-clamp-2 text-sm text-espresso-muted">
                    {review.note}
                  </p>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-espresso/40 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-sm rounded-2xl border border-espresso/[0.08] bg-cream p-6">
            <h3 className="font-heading text-2xl text-espresso">Delete cafe?</h3>
            <p className="mt-2 text-sm text-espresso-muted">
              This will permanently delete <strong>{cafe.name}</strong> and all its reviews, items, and photos.
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
