"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { SipsCup, SipsLabel } from "@/components/ui/SipsRating";
import { searchCafes, createCafe } from "@/lib/actions/cafes";
import { createReview } from "@/lib/actions/reviews";
import { uploadPhotoAction } from "@/lib/actions/photos";
import { resizeImage } from "@/lib/image-utils";

export const dynamic = "force-dynamic";

// ── Types ──────────────────────────────────────────────

type CafeResult = {
  id: string;
  name: string;
  slug: string;
  neighborhood: string;
};

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

// ── Step components ────────────────────────────────────

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`h-1.5 flex-1 rounded-full transition-colors ${
            i + 1 <= current ? "bg-terracotta" : "bg-espresso/[0.1]"
          }`}
        />
      ))}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────

export default function QuickAddPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  // Step 1: Cafe
  const [cafeQuery, setCafeQuery] = useState("");
  const [results, setResults] = useState<CafeResult[]>([]);
  const [selectedCafe, setSelectedCafe] = useState<CafeResult | null>(null);
  const [isNewCafe, setIsNewCafe] = useState(false);
  const [newCafeName, setNewCafeName] = useState("");
  const [newCafeNeighborhood, setNewCafeNeighborhood] = useState("");
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  // Step 2: Rating + Photo
  const [rating, setRating] = useState(3);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step 3: Note
  const [note, setNote] = useState("");

  // Step 4: Saving
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  // ── Cafe search ──

  function handleSearch(query: string) {
    setCafeQuery(query);
    setSelectedCafe(null);
    setIsNewCafe(false);

    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (query.length < 2) {
      setResults([]);
      return;
    }

    searchTimeout.current = setTimeout(async () => {
      const data = await searchCafes(query);
      setResults(data);
    }, 300);
  }

  function pickCafe(cafe: CafeResult) {
    setSelectedCafe(cafe);
    setCafeQuery(cafe.name);
    setResults([]);
  }

  function pickNewCafe() {
    setIsNewCafe(true);
    setNewCafeName(cafeQuery);
    setResults([]);
  }

  // ── Photo ──

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  function removePhoto() {
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhoto(null);
    setPhotoPreview(null);
  }

  // ── Save ──

  async function handleSave() {
    setSaving(true);
    setError(null);

    try {
      let cafeId: string;
      let cafeSlug: string;

      if (selectedCafe) {
        cafeId = selectedCafe.id;
        cafeSlug = selectedCafe.slug;
      } else {
        const result = await createCafe({
          name: newCafeName,
          neighborhood: newCafeNeighborhood,
        });
        if (result.error || !result.cafe) {
          setError(result.error ?? "Failed to create cafe");
          setSaving(false);
          return;
        }
        cafeId = result.cafe.id;
        cafeSlug = result.cafe.slug;
      }

      // Upload photo if present
      const photoUrls: string[] = [];
      if (photo) {
        const resized = await resizeImage(photo);
        const formData = new FormData();
        formData.append("file", resized);
        formData.append("cafeSlug", cafeSlug);
        const uploadResult = await uploadPhotoAction(formData);
        if (uploadResult.url) photoUrls.push(uploadResult.url);
      }

      // Create draft review
      const result = await createReview({
        cafe_id: cafeId,
        overall_rating: rating,
        note,
        date_visited: new Date().toISOString().slice(0, 10),
        status: "draft",
        photo_urls: photoUrls.length > 0 ? photoUrls : undefined,
      });

      if (result.error) {
        setError(result.error);
        setSaving(false);
        return;
      }

      setDone(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  // ── Can advance? ──

  const canAdvanceStep1 = selectedCafe || (isNewCafe && newCafeName && newCafeNeighborhood);

  // ── Render ──

  if (done) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-cream px-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <Image
            src="/illustrations/coffee-cup.svg"
            alt=""
            width={64}
            height={64}
            className="mx-auto mb-4 opacity-50"
          />
          <h1 className="font-heading text-4xl text-espresso">Saved!</h1>
          <p className="mt-2 text-espresso-muted">Draft review created.</p>
          <div className="mt-8 flex flex-col gap-3">
            <button
              onClick={() => {
                setDone(false);
                setStep(1);
                setSelectedCafe(null);
                setIsNewCafe(false);
                setCafeQuery("");
                setNewCafeName("");
                setNewCafeNeighborhood("");
                setRating(3);
                removePhoto();
                setNote("");
              }}
              className="rounded-xl bg-terracotta px-6 py-3 text-sm text-cream transition-colors hover:bg-terracotta-dark"
            >
              Add Another
            </button>
            <Link
              href="/admin"
              className="rounded-xl border border-espresso/[0.12] px-6 py-3 text-center text-sm text-espresso transition-colors hover:bg-stone"
            >
              Back to Dashboard
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-cream">
      {/* Top bar */}
      <div className="px-6 pt-6">
        <div className="mx-auto max-w-lg">
          <div className="mb-4 flex items-center justify-between">
            <Link
              href="/admin"
              className="text-sm text-espresso-muted hover:text-terracotta"
            >
              &larr; Cancel
            </Link>
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-espresso-muted">
              Step {step} of 4
            </span>
          </div>
          <StepIndicator current={step} total={4} />
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col px-6 py-8">
        <div className="mx-auto w-full max-w-lg">
          <AnimatePresence mode="wait">
            {/* ── Step 1: Pick Cafe ── */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <h1 className="font-heading text-4xl text-espresso">
                  Where are you?
                </h1>
                <p className="mt-1 text-sm text-espresso-muted">
                  Search for a cafe or add a new one.
                </p>

                <input
                  type="text"
                  value={cafeQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Search cafes..."
                  autoFocus
                  className="mt-6 w-full rounded-xl border border-espresso/[0.12] bg-cream px-4 py-3.5 text-espresso placeholder:text-espresso-muted/50 focus:border-terracotta focus:outline-none focus:ring-1 focus:ring-terracotta/30"
                />

                {/* Results */}
                {results.length > 0 && !selectedCafe && (
                  <div className="mt-3 space-y-1">
                    {results.map((cafe) => (
                      <button
                        key={cafe.id}
                        onClick={() => pickCafe(cafe)}
                        className="flex w-full items-center justify-between rounded-lg px-4 py-3 text-left transition-colors hover:bg-sage/10"
                      >
                        <span className="text-espresso">{cafe.name}</span>
                        <span className="font-mono text-[10px] uppercase tracking-wider text-espresso-muted">
                          {cafe.neighborhood}
                        </span>
                      </button>
                    ))}
                    <button
                      onClick={pickNewCafe}
                      className="flex w-full items-center gap-2 rounded-lg px-4 py-3 text-left text-terracotta transition-colors hover:bg-terracotta/5"
                    >
                      + Add &ldquo;{cafeQuery}&rdquo; as new cafe
                    </button>
                  </div>
                )}

                {/* Selected cafe badge */}
                {selectedCafe && (
                  <div className="mt-4 flex items-center justify-between rounded-xl border border-sage/30 bg-sage/5 px-4 py-3">
                    <div>
                      <p className="font-medium text-espresso">{selectedCafe.name}</p>
                      <p className="font-mono text-[10px] uppercase tracking-wider text-espresso-muted">
                        {selectedCafe.neighborhood}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedCafe(null);
                        setCafeQuery("");
                      }}
                      className="text-sm text-espresso-muted hover:text-terracotta"
                    >
                      Change
                    </button>
                  </div>
                )}

                {/* New cafe fields */}
                {isNewCafe && (
                  <div className="mt-4 space-y-3">
                    <input
                      type="text"
                      value={newCafeName}
                      onChange={(e) => setNewCafeName(e.target.value)}
                      placeholder="Cafe name"
                      className="w-full rounded-xl border border-espresso/[0.12] bg-cream px-4 py-3 text-espresso placeholder:text-espresso-muted/50 focus:border-terracotta focus:outline-none"
                    />
                    <select
                      value={newCafeNeighborhood}
                      onChange={(e) => setNewCafeNeighborhood(e.target.value)}
                      className="w-full appearance-none rounded-xl border border-espresso/[0.12] bg-cream px-4 py-3 text-espresso focus:border-terracotta focus:outline-none"
                    >
                      <option value="" disabled>
                        Neighborhood
                      </option>
                      {NEIGHBORHOODS.map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <button
                  onClick={() => setStep(2)}
                  disabled={!canAdvanceStep1}
                  className="mt-8 w-full rounded-xl bg-terracotta py-4 text-sm font-medium text-cream transition-colors hover:bg-terracotta-dark disabled:opacity-30"
                >
                  Next
                </button>
              </motion.div>
            )}

            {/* ── Step 2: Rate + Photo ── */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <h1 className="font-heading text-4xl text-espresso">
                  How was it?
                </h1>
                <p className="mt-1 text-sm text-espresso-muted">
                  Tap to rate, snap a photo if you want.
                </p>

                {/* Rating */}
                <div className="mt-8 flex flex-col items-center gap-3">
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
                        <SipsCup sips={i} size={56} compact />
                      </button>
                    ))}
                  </div>
                  <SipsLabel sips={rating} className="text-lg" />
                </div>

                {/* Photo */}
                <div className="mt-10">
                  {photoPreview ? (
                    <div className="relative">
                      <img
                        src={photoPreview}
                        alt="Preview"
                        className="w-full rounded-xl object-cover"
                        style={{ maxHeight: 240 }}
                      />
                      <button
                        onClick={removePhoto}
                        className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-espresso/60 text-cream backdrop-blur-sm"
                      >
                        &times;
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed border-espresso/[0.12] py-10 text-espresso-muted transition-colors hover:border-terracotta/30 hover:text-terracotta"
                    >
                      <svg
                        className="h-8 w-8"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z"
                        />
                      </svg>
                      <span className="text-sm">Take a photo</span>
                    </button>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handlePhoto}
                    className="hidden"
                  />
                </div>

                <div className="mt-8 flex gap-3">
                  <button
                    onClick={() => setStep(1)}
                    className="rounded-xl border border-espresso/[0.12] px-6 py-4 text-sm text-espresso transition-colors hover:bg-stone"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    className="flex-1 rounded-xl bg-terracotta py-4 text-sm font-medium text-cream transition-colors hover:bg-terracotta-dark"
                  >
                    Next
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── Step 3: Note ── */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <h1 className="font-heading text-4xl text-espresso">
                  Any thoughts?
                </h1>
                <p className="mt-1 text-sm text-espresso-muted">
                  Optional — you can always add more later.
                </p>

                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Quick notes about the vibe, coffee, food..."
                  rows={5}
                  autoFocus
                  className="mt-6 w-full resize-none rounded-xl border border-espresso/[0.12] bg-cream px-4 py-3.5 text-espresso placeholder:text-espresso-muted/50 focus:border-terracotta focus:outline-none focus:ring-1 focus:ring-terracotta/30"
                />

                <div className="mt-8 flex gap-3">
                  <button
                    onClick={() => setStep(2)}
                    className="rounded-xl border border-espresso/[0.12] px-6 py-4 text-sm text-espresso transition-colors hover:bg-stone"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setStep(4)}
                    className="flex-1 rounded-xl bg-terracotta py-4 text-sm font-medium text-cream transition-colors hover:bg-terracotta-dark"
                  >
                    {note ? "Next" : "Skip"}
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── Step 4: Confirm ── */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <h1 className="font-heading text-4xl text-espresso">
                  Looking good?
                </h1>
                <p className="mt-1 text-sm text-espresso-muted">
                  Saves as a draft — refine it later.
                </p>

                {/* Summary */}
                <div className="mt-6 space-y-4">
                  <div className="rounded-xl border border-espresso/[0.08] bg-cream p-4">
                    <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-espresso-muted">
                      Cafe
                    </p>
                    <p className="mt-1 text-lg font-medium text-espresso">
                      {selectedCafe?.name ?? newCafeName}
                    </p>
                    <p className="text-sm text-espresso-muted">
                      {selectedCafe?.neighborhood ?? newCafeNeighborhood}
                    </p>
                  </div>

                  <div className="rounded-xl border border-espresso/[0.08] bg-cream p-4">
                    <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-espresso-muted">
                      Rating
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <SipsCup sips={rating} size={36} compact />
                      <SipsLabel sips={rating} className="text-base" />
                    </div>
                  </div>

                  {photoPreview && (
                    <div className="overflow-hidden rounded-xl border border-espresso/[0.08]">
                      <img
                        src={photoPreview}
                        alt="Preview"
                        className="w-full object-cover"
                        style={{ maxHeight: 160 }}
                      />
                    </div>
                  )}

                  {note && (
                    <div className="rounded-xl border border-espresso/[0.08] bg-cream p-4">
                      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-espresso-muted">
                        Note
                      </p>
                      <p className="mt-1 text-sm text-espresso-muted">
                        {note}
                      </p>
                    </div>
                  )}
                </div>

                {error && (
                  <div className="mt-4 rounded-xl border border-terracotta/20 bg-terracotta/5 p-3 text-center text-sm text-terracotta">
                    {error}
                  </div>
                )}

                <div className="mt-8 flex gap-3">
                  <button
                    onClick={() => setStep(3)}
                    disabled={saving}
                    className="rounded-xl border border-espresso/[0.12] px-6 py-4 text-sm text-espresso transition-colors hover:bg-stone disabled:opacity-50"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 rounded-xl bg-terracotta py-4 text-sm font-medium text-cream transition-colors hover:bg-terracotta-dark disabled:opacity-50"
                  >
                    {saving ? "Saving..." : "Save as Draft"}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
