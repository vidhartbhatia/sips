"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useDropzone } from "react-dropzone";
import Header from "@/components/layout/Header";
import { SipsCup, SipsLabel } from "@/components/ui/SipsRating";
import { createCafe, searchCafes } from "@/lib/actions/cafes";
import { createReview } from "@/lib/actions/reviews";
import { uploadPhotoAction } from "@/lib/actions/photos";

export const dynamic = "force-dynamic";

// ── Constants ──────────────────────────────────────────────

const NEIGHBORHOODS = [
  "Capitol Hill",
  "Fremont",
  "Ballard",
  "Pike Place",
  "Pioneer Square",
  "University District",
  "Wallingford",
  "Queen Anne",
  "Georgetown",
  "Columbia City",
  "Beacon Hill",
  "Other",
];

const ITEM_TYPES = [
  "latte",
  "drip",
  "matcha",
  "espresso",
  "cappuccino",
  "americano",
  "cold brew",
  "pour over",
  "chai",
  "tea",
  "pastry",
  "sandwich",
  "salad",
  "other",
];

const VIBE_TAGS = [
  "cozy",
  "modern",
  "spacious",
  "bright",
  "dark",
  "loud",
  "quiet",
  "outdoor seating",
  "good wifi",
  "dog friendly",
];

// ── Types ──────────────────────────────────────────────────

type ItemEntry = {
  id: string;
  name: string;
  category: "drink" | "food";
  type: string;
  rating: number;
  is_favorite: boolean;
  notes: string;
};

type PreviewFile = {
  file: File;
  preview: string;
};

// ── Helpers ────────────────────────────────────────────────

function newItem(): ItemEntry {
  return {
    id: crypto.randomUUID(),
    name: "",
    category: "drink",
    type: "latte",
    rating: 3,
    is_favorite: false,
    notes: "",
  };
}

// ── Small components ───────────────────────────────────────

function SipSelector({
  value,
  onChange,
  size = "md",
}: {
  value: number;
  onChange: (v: number) => void;
  size?: "sm" | "md";
}) {
  const cupSize = size === "sm" ? 28 : 36;
  return (
    <span className="inline-flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i)}
          className={`transition-opacity ${
            i <= value ? "opacity-100" : "opacity-30 hover:opacity-60"
          }`}
          aria-label={`${i} sips`}
        >
          <SipsCup sips={i} size={cupSize} compact />
        </button>
      ))}
      <SipsLabel sips={value} className="ml-2 text-sm" />
    </span>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-1 block font-heading text-lg text-espresso">
      {children}
    </label>
  );
}

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="hand-drawn-border bg-cream p-5 sm:p-6"
    >
      <h2 className="mb-4 font-heading text-xl font-semibold text-espresso">
        {title}
      </h2>
      {children}
    </motion.section>
  );
}

// ── Main page ──────────────────────────────────────────────

export default function NewReviewPage() {
  const router = useRouter();

  // Cafe fields
  const [cafeName, setCafeName] = useState("");
  const [cafeAddress, setCafeAddress] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [selectedCafeId, setSelectedCafeId] = useState<string | null>(null);
  const [selectedCafeSlug, setSelectedCafeSlug] = useState<string | null>(null);
  const [cafeSearchResults, setCafeSearchResults] = useState<Array<{ id: string; name: string; slug: string; neighborhood: string }>>([]);
  const [showCafeDropdown, setShowCafeDropdown] = useState(false);
  const [isNewCafe, setIsNewCafe] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Review fields
  const [overallRating, setOverallRating] = useState(3);
  const [note, setNote] = useState("");
  const [dateVisited, setDateVisited] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [status, setStatus] = useState<"published" | "draft">("draft");

  // Items
  const [items, setItems] = useState<ItemEntry[]>([newItem()]);

  // Photos
  const [photos, setPhotos] = useState<PreviewFile[]>([]);

  // Vibe tags
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // ── Item helpers ──

  function updateItem(id: string, patch: Partial<ItemEntry>) {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, ...patch } : it))
    );
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((it) => it.id !== id));
  }

  function addItem() {
    setItems((prev) => [...prev, newItem()]);
  }

  // ── Tag toggle ──

  function toggleTag(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  // ── Dropzone ──

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const previews = acceptedFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setPhotos((prev) => [...prev, ...previews]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
  });

  function removePhoto(idx: number) {
    setPhotos((prev) => {
      URL.revokeObjectURL(prev[idx].preview);
      return prev.filter((_, i) => i !== idx);
    });
  }

  // ── Cafe search ──

  function handleCafeNameChange(value: string) {
    setCafeName(value);
    setSelectedCafeId(null);
    setSelectedCafeSlug(null);
    setIsNewCafe(false);

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (value.length < 2) {
      setCafeSearchResults([]);
      setShowCafeDropdown(false);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      const results = await searchCafes(value);
      setCafeSearchResults(results);
      setShowCafeDropdown(true);
    }, 300);
  }

  function selectCafe(cafe: { id: string; name: string; slug: string; neighborhood: string }) {
    setCafeName(cafe.name);
    setNeighborhood(cafe.neighborhood);
    setSelectedCafeId(cafe.id);
    setSelectedCafeSlug(cafe.slug);
    setIsNewCafe(false);
    setShowCafeDropdown(false);
    setCafeSearchResults([]);
  }

  function selectNewCafe() {
    setSelectedCafeId(null);
    setSelectedCafeSlug(null);
    setIsNewCafe(true);
    setShowCafeDropdown(false);
    setCafeSearchResults([]);
  }

  // ── Submit ──

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);

    try {
      let cafeId = selectedCafeId;
      let cafeSlug = selectedCafeSlug;

      // Create new cafe if needed
      if (!cafeId) {
        const result = await createCafe({
          name: cafeName,
          address: cafeAddress || undefined,
          neighborhood,
          vibe_tags: selectedTags,
        });
        if (result.error || !result.cafe) {
          setSubmitError(result.error ?? "Failed to create cafe");
          setSubmitting(false);
          return;
        }
        cafeId = result.cafe.id;
        cafeSlug = result.cafe.slug;
      }

      // Upload photos
      const photoUrls: string[] = [];
      for (const p of photos) {
        const formData = new FormData();
        formData.append("file", p.file);
        formData.append("cafeSlug", cafeSlug!);
        const result = await uploadPhotoAction(formData);
        if (result.url) photoUrls.push(result.url);
      }

      // Create review
      const reviewItems = items
        .filter((it) => it.name.trim())
        .map((it) => ({
          name: it.name,
          category: it.category,
          type: it.type,
          rating: it.rating,
          is_favorite: it.is_favorite,
          notes: it.notes || undefined,
        }));

      const result = await createReview({
        cafe_id: cafeId!,
        overall_rating: overallRating,
        note,
        date_visited: dateVisited,
        status,
        items: reviewItems.length > 0 ? reviewItems : undefined,
        photo_urls: photoUrls.length > 0 ? photoUrls : undefined,
      });

      if (result.error) {
        setSubmitError(result.error);
        setSubmitting(false);
        return;
      }

      // Success — redirect to admin
      router.push("/admin");
    } catch (err) {
      setSubmitError((err as Error).message);
      setSubmitting(false);
    }
  }

  // ── Shared input styles ──

  const inputClass =
    "w-full rounded-md border border-espresso/20 bg-cream px-3 py-2 text-espresso placeholder:text-espresso-muted/50 focus:border-terracotta focus:outline-none focus:ring-1 focus:ring-terracotta/30";
  const selectClass = `${inputClass} appearance-none`;

  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-6 py-10">
        {/* Top bar */}
        <div className="mb-8">
          <Link
            href="/admin"
            className="mb-2 inline-block font-heading text-base text-espresso-muted hover:text-terracotta"
          >
            &larr; Dashboard
          </Link>
          <h1 className="font-heading text-3xl font-bold text-espresso">
            <span className="sketchy-underline">New Review</span>
          </h1>
          <p className="mt-2 font-heading text-lg text-espresso-muted">
            document another sip-worthy spot
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* ── 1. Cafe Selection ── */}
          <SectionCard title="Cafe">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="relative sm:col-span-2">
                <Label>Cafe Name</Label>
                <input
                  type="text"
                  value={cafeName}
                  onChange={(e) => handleCafeNameChange(e.target.value)}
                  onFocus={() => cafeSearchResults.length > 0 && setShowCafeDropdown(true)}
                  onBlur={() => setTimeout(() => setShowCafeDropdown(false), 200)}
                  placeholder="Search existing or type new name..."
                  className={inputClass}
                  required
                />
                {selectedCafeId && (
                  <span className="mt-1 block font-mono text-[10px] uppercase tracking-[0.2em] text-sage">
                    existing cafe selected
                  </span>
                )}
                {isNewCafe && (
                  <span className="mt-1 block font-mono text-[10px] uppercase tracking-[0.2em] text-terracotta">
                    adding new cafe
                  </span>
                )}
                {showCafeDropdown && (
                  <div className="absolute left-0 right-0 top-full z-10 mt-1 max-h-48 overflow-y-auto rounded-lg border border-espresso/[0.12] bg-cream shadow-lg">
                    {cafeSearchResults.map((cafe) => (
                      <button
                        key={cafe.id}
                        type="button"
                        onMouseDown={() => selectCafe(cafe)}
                        className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-espresso transition-colors hover:bg-sage/10"
                      >
                        <span>{cafe.name}</span>
                        <span className="font-mono text-[10px] uppercase tracking-wider text-espresso-muted">
                          {cafe.neighborhood}
                        </span>
                      </button>
                    ))}
                    <button
                      type="button"
                      onMouseDown={selectNewCafe}
                      className="flex w-full items-center gap-2 border-t border-espresso/[0.08] px-3 py-2 text-left text-sm text-terracotta transition-colors hover:bg-terracotta/5"
                    >
                      + Add &ldquo;{cafeName}&rdquo; as new cafe
                    </button>
                  </div>
                )}
              </div>
              {(!selectedCafeId || isNewCafe) && (
                <>
                  <div>
                    <Label>Address</Label>
                    <input
                      type="text"
                      value={cafeAddress}
                      onChange={(e) => setCafeAddress(e.target.value)}
                      placeholder="123 Main St, Seattle"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <Label>Neighborhood</Label>
                    <select
                      value={neighborhood}
                      onChange={(e) => setNeighborhood(e.target.value)}
                      className={selectClass}
                      required
                    >
                      <option value="" disabled>
                        Select neighborhood
                      </option>
                      {NEIGHBORHOODS.map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}
            </div>
          </SectionCard>

          {/* ── 2. Rating ── */}
          <SectionCard title="Overall Rating">
            <div className="flex items-center gap-4">
              <SipSelector value={overallRating} onChange={setOverallRating} />
              <span className="font-heading text-lg text-espresso-muted">
                {overallRating} / 5 sips
              </span>
            </div>
          </SectionCard>

          {/* ── 3. Items / Drinks ── */}
          <SectionCard title="Items & Drinks">
            <AnimatePresence mode="popLayout">
              {items.map((it, idx) => (
                <motion.div
                  key={it.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-4 overflow-hidden"
                >
                  <div className="rounded-lg border border-espresso/10 bg-cream p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="font-heading text-base text-espresso-muted">
                        Item {idx + 1}
                      </span>
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(it.id)}
                          className="font-heading text-sm text-espresso-muted hover:text-terracotta"
                        >
                          remove
                        </button>
                      )}
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <Label>Name</Label>
                        <input
                          type="text"
                          value={it.name}
                          onChange={(e) =>
                            updateItem(it.id, { name: e.target.value })
                          }
                          placeholder="Oat Milk Latte"
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <Label>Category</Label>
                        <select
                          value={it.category}
                          onChange={(e) =>
                            updateItem(it.id, {
                              category: e.target.value as "drink" | "food",
                            })
                          }
                          className={selectClass}
                        >
                          <option value="drink">Drink</option>
                          <option value="food">Food</option>
                        </select>
                      </div>
                      <div>
                        <Label>Type</Label>
                        <select
                          value={it.type}
                          onChange={(e) =>
                            updateItem(it.id, { type: e.target.value })
                          }
                          className={selectClass}
                        >
                          {ITEM_TYPES.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <Label>Rating</Label>
                        <SipSelector
                          value={it.rating}
                          onChange={(v) => updateItem(it.id, { rating: v })}
                          size="sm"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <Label>Notes</Label>
                        <input
                          type="text"
                          value={it.notes}
                          onChange={(e) =>
                            updateItem(it.id, { notes: e.target.value })
                          }
                          placeholder="any tasting notes..."
                          className={inputClass}
                        />
                      </div>
                      <div className="flex items-center gap-2 sm:col-span-2">
                        <button
                          type="button"
                          onClick={() =>
                            updateItem(it.id, {
                              is_favorite: !it.is_favorite,
                            })
                          }
                          className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-lg transition-colors ${
                            it.is_favorite
                              ? "border-terracotta bg-terracotta text-cream"
                              : "border-espresso/20 text-espresso/30 hover:border-terracotta-light"
                          }`}
                          aria-label="Toggle favorite"
                        >
                          &hearts;
                        </button>
                        <span className="font-heading text-sm text-espresso-muted">
                          {it.is_favorite ? "Favorite!" : "Mark as favorite"}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            <button
              type="button"
              onClick={addItem}
              className="hand-drawn-border mt-1 w-full bg-cream px-4 py-2 font-heading text-base text-espresso-muted transition-colors hover:bg-sage-light/15 hover:text-espresso"
            >
              + Add another item
            </button>
          </SectionCard>

          {/* ── 4. Review Note ── */}
          <SectionCard title="Review Note">
            <Label>Your thoughts</Label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What made this visit memorable? How was the atmosphere, the coffee, the pastries..."
              rows={5}
              className={`${inputClass} resize-y`}
            />
          </SectionCard>

          {/* ── 5. Date Visited ── */}
          <SectionCard title="Date Visited">
            <Label>When did you go?</Label>
            <input
              type="date"
              value={dateVisited}
              onChange={(e) => setDateVisited(e.target.value)}
              className={`${inputClass} max-w-xs`}
            />
          </SectionCard>

          {/* ── 6. Photos ── */}
          <SectionCard title="Photos">
            <div
              {...getRootProps()}
              className={`hand-drawn-border cursor-pointer bg-cream p-8 text-center transition-colors ${
                isDragActive
                  ? "border-terracotta bg-terracotta/5"
                  : "hover:bg-sage-light/10"
              }`}
            >
              <input {...getInputProps()} />
              <p className="font-heading text-lg text-espresso-muted">
                {isDragActive
                  ? "Drop your photos here..."
                  : "Drag & drop photos here, or click to browse"}
              </p>
              <p className="mt-1 font-heading text-sm text-espresso-muted/60">
                JPG, PNG, WEBP accepted
              </p>
            </div>

            {photos.length > 0 && (
              <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
                {photos.map((p, idx) => (
                  <div key={idx} className="group relative">
                    <img
                      src={p.preview}
                      alt={`Preview ${idx + 1}`}
                      className="hand-drawn-border aspect-square w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(idx)}
                      className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-terracotta text-xs text-cream opacity-0 transition-opacity group-hover:opacity-100"
                      aria-label="Remove photo"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          {/* ── 7. Vibe Tags ── */}
          <SectionCard title="Vibe Tags">
            <div className="flex flex-wrap gap-2">
              {VIBE_TAGS.map((tag) => {
                const active = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`hand-drawn-border px-3.5 py-1.5 font-heading text-base transition-colors ${
                      active
                        ? "bg-sage text-cream"
                        : "bg-cream text-espresso-muted hover:bg-sage-light/20"
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </SectionCard>

          {/* ── 8. Status ── */}
          <SectionCard title="Status">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setStatus("draft")}
                className={`hand-drawn-border px-4 py-2 font-heading text-base transition-colors ${
                  status === "draft"
                    ? "bg-pink-light/50 text-espresso"
                    : "bg-cream text-espresso-muted hover:bg-pink-light/20"
                }`}
              >
                Draft
              </button>
              <button
                type="button"
                onClick={() => setStatus("published")}
                className={`hand-drawn-border px-4 py-2 font-heading text-base transition-colors ${
                  status === "published"
                    ? "bg-sage text-cream"
                    : "bg-cream text-espresso-muted hover:bg-sage-light/20"
                }`}
              >
                Publish
              </button>
            </div>
          </SectionCard>

          {/* ── 9. Submit ── */}
          {submitError && (
            <div className="rounded-xl border border-terracotta/20 bg-terracotta/5 p-4 text-center text-sm text-terracotta">
              {submitError}
            </div>
          )}
          <motion.button
            type="submit"
            disabled={submitting}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            className="hand-drawn-border w-full bg-terracotta py-3.5 font-heading text-xl text-cream transition-colors hover:bg-terracotta-dark disabled:opacity-50"
          >
            {submitting ? "Saving..." : "Save Review"}
          </motion.button>
        </form>
      </main>
    </>
  );
}
