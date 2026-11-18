"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import CafePicker, { type CafeChoice } from "@/components/admin/capture/CafePicker";
import DrinkList, { emptyDrink, type DrinkDraft } from "@/components/admin/capture/DrinkList";
import PhotoPicker from "@/components/admin/capture/PhotoPicker";
import ScoreInput from "@/components/admin/capture/ScoreInput";
import { createCafe } from "@/lib/actions/cafes";
import { createReviewDraft, setReviewCover } from "@/lib/actions/reviews";
import { addReviewPhoto } from "@/lib/actions/photos";
import { resizeImage } from "@/lib/image-utils";
import { uploadVisitPhotos, type FailedPhoto, type PendingPhoto } from "@/lib/capture-upload";

const inputClass =
  "w-full min-h-12 rounded-xl border border-espresso/[0.15] bg-cream px-4 py-3 text-base text-espresso placeholder:text-espresso-muted focus:border-espresso focus:outline-none focus:ring-1 focus:ring-espresso/30";

/** Today in the device's time zone, as YYYY-MM-DD. */
function today(): string {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-espresso-muted">{title}</h2>
        {hint && <p className="mt-1 text-sm text-espresso-muted">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

/**
 * One form for phone and laptop. It always saves a draft: drafts are private, scores are
 * optional, and publishing happens later from the review's edit page.
 *
 * Save: create the cafe if it's new, create the draft with its drinks, then upload each photo
 * resized and in its own request (lib/capture-upload.ts). The first photo becomes the cover.
 */
export default function CapturePage() {
  const router = useRouter();

  const [photos, setPhotos] = useState<File[]>([]);
  const [cafe, setCafe] = useState<CafeChoice | null>(null);
  const [dateVisited, setDateVisited] = useState(today);
  const [drinks, setDrinks] = useState<DrinkDraft[]>(() => [emptyDrink()]);
  const [overall, setOverall] = useState<number | null>(null);
  const [verdict, setVerdict] = useState("");
  const [note, setNote] = useState("");

  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Generated once: sending the same draft twice (a lost response) returns the same review.
  const [draftId] = useState(() => crypto.randomUUID());
  // Once the draft exists, a retry only re-sends the photos that failed.
  const [reviewId, setReviewId] = useState<string | null>(null);
  const [failed, setFailed] = useState<FailedPhoto[]>([]);

  const cafeReady =
    cafe?.kind === "existing" || (cafe?.kind === "new" && cafe.name.trim() !== "" && cafe.neighborhood !== "");

  function uploadAll(id: string, pending: readonly PendingPhoto[]) {
    return uploadVisitPhotos(pending, {
      resize: resizeImage,
      addPhoto: (blob, itemId) => {
        const form = new FormData();
        form.append("file", blob, blob instanceof File ? blob.name : "photo.jpg");
        return addReviewPhoto(id, form, { itemId });
      },
      // A cover that fails to set isn't fatal: the visit then uses its oldest photo, which
      // is the first one uploaded.
      setCover: (photoId) => setReviewCover(id, photoId),
      onProgress: (n, total) => setProgress(`Uploading photo ${n} of ${total}…`),
    });
  }

  async function save() {
    setError(null);
    // The draft and its photos are already saved (an earlier attempt stopped after that):
    // open it rather than uploading the photos twice.
    if (reviewId) {
      router.push(`/admin/review/${reviewId}/edit`);
      return;
    }
    if (!cafeReady || !cafe) {
      setError("Pick the cafe first (or add it with a neighbourhood).");
      return;
    }
    setSaving(true);
    try {
      let cafeId: string;
      if (cafe.kind === "existing") {
        cafeId = cafe.id;
      } else {
        setProgress("Adding the cafe…");
        const { place } = cafe;
        const created = await createCafe({
          name: cafe.name.trim(),
          neighborhood: cafe.neighborhood,
          // From the place search; a cafe added by name only gets its address later.
          ...(place && { address: place.address, lat: place.lat, lng: place.lng, google_place_id: place.placeId }),
        });
        if (created.error || !created.cafe) throw new Error(created.error ?? "Couldn't add the cafe.");
        cafeId = created.cafe.id;
        // If anything below fails, a retry reuses this cafe instead of creating it twice.
        setCafe({ kind: "existing", id: cafeId, name: created.cafe.name, neighborhood: created.cafe.neighborhood });
      }

      setProgress("Saving the draft…");
      const kept = drinks.filter((d) => d.name.trim() !== "");
      const draft = await createReviewDraft({
        id: draftId,
        cafe_id: cafeId,
        date_visited: dateVisited,
        overall_rating: overall,
        verdict,
        note,
        items: kept.map((d) => ({
          name: d.name.trim(),
          category: d.category,
          type: null,
          rating: d.rating,
          is_favorite: d.is_favorite,
          notes: d.notes,
        })),
      });
      if (draft.error || !draft.reviewId) throw new Error(draft.error ?? "Couldn't save the draft.");
      setReviewId(draft.reviewId);

      const pending: PendingPhoto[] = [
        ...photos.map((file, i) => ({ file, isCover: i === 0 })),
        ...kept.flatMap((d, i) => d.photo.map((file) => ({ file, itemId: draft.itemIds?.[i] }))),
      ];
      const { failed: failures } = await uploadAll(draft.reviewId, pending);
      if (failures.length > 0) {
        setFailed(failures);
        return;
      }
      router.push(`/admin/review/${draft.reviewId}/edit`);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setProgress(null);
      setSaving(false);
    }
  }

  async function retry() {
    if (!reviewId) return;
    setSaving(true);
    setError(null);
    try {
      // The photo marked as cover keeps its flag, so it becomes the cover if it uploads now.
      const { failed: failures } = await uploadAll(reviewId, failed);
      setFailed(failures);
      if (failures.length === 0) router.push(`/admin/review/${reviewId}/edit`);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setProgress(null);
      setSaving(false);
    }
  }

  if (reviewId && failed.length > 0) {
    return (
      <main className="mx-auto min-h-screen max-w-lg bg-cream px-5 py-8">
        <h1 className="font-heading text-4xl text-espresso">Draft saved</h1>
        <p className="mt-2 text-espresso">
          {failed.length === 1 ? "One photo didn't upload." : `${failed.length} photos didn't upload.`} Everything
          else is saved.
        </p>
        <ul className="mt-4 space-y-2 text-sm text-espresso">
          {failed.map((f, i) => (
            <li key={`${f.file.name}-${i}`} className="rounded-lg border border-espresso/[0.12] px-3 py-2">
              <span className="font-medium">{f.file.name}</span>
              <span className="block text-espresso-muted">{f.error}</span>
            </li>
          ))}
        </ul>
        {error && (
          <p role="alert" className="mt-4 rounded-lg border border-terracotta-dark/40 px-3 py-2 text-sm text-espresso">
            {error}
          </p>
        )}
        <div className="mt-6 flex flex-col gap-3">
          <button
            type="button"
            onClick={retry}
            disabled={saving}
            className="min-h-12 rounded-xl bg-terracotta-dark px-6 text-base text-cream transition-colors hover:bg-espresso disabled:opacity-60"
          >
            {saving ? progress ?? "Retrying…" : "Try those again"}
          </button>
          <Link
            href={`/admin/review/${reviewId}/edit`}
            className="flex min-h-12 items-center justify-center rounded-xl border border-espresso/[0.15] text-base text-espresso hover:bg-stone/60"
          >
            Skip them and open the draft
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-lg bg-cream px-5 pb-32 pt-6">
      <div className="flex items-center justify-between">
        <Link href="/admin" className="flex min-h-12 items-center text-sm text-espresso-muted hover:text-espresso">
          &larr; Dashboard
        </Link>
        <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-espresso-muted">draft</span>
      </div>
      <h1 className="mt-2 font-heading text-5xl text-espresso">New visit</h1>
      <p className="mt-1 text-sm text-espresso-muted">Saves as a private draft. Scores can wait.</p>

      <form
        className="mt-8 space-y-10"
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
      >
        <Section title="Photos" hint="Window light, no flash. A landscape hero first, then the rest.">
          <PhotoPicker files={photos} onChange={setPhotos} label="Add photos" />
        </Section>

        <Section title="Cafe">
          <CafePicker value={cafe} onChange={setCafe} inputClass={inputClass} />
          <label className="block">
            <span className="mb-1 block text-sm text-espresso-muted">Visited</span>
            <input
              type="date"
              value={dateVisited}
              max={today()}
              onChange={(e) => setDateVisited(e.target.value)}
              className={inputClass}
              required
            />
          </label>
        </Section>

        <Section title="What we tried">
          <DrinkList drinks={drinks} onChange={setDrinks} inputClass={inputClass} />
        </Section>

        <Section title="Overall">
          <ScoreInput value={overall} onChange={setOverall} label="Overall score" />
        </Section>

        <Section title="Verdict" hint="One line. What would you tell a friend?">
          <label className="block">
            <span className="sr-only">Verdict</span>
            <input
              type="text"
              value={verdict}
              onChange={(e) => setVerdict(e.target.value)}
              placeholder="The hojicha alone is worth the walk."
              className={`${inputClass} font-display text-lg italic`}
            />
          </label>
        </Section>

        <Section title="Note" hint="Optional. Anything to remember for the write-up.">
          <label className="block">
            <span className="sr-only">Note</span>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={4}
              className={`${inputClass} resize-y`}
            />
          </label>
        </Section>

        <div className="fixed inset-x-0 bottom-0 border-t border-espresso/[0.08] bg-cream/95 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-sm">
          <div className="mx-auto max-w-lg">
            {/* In the sticky bar, so a failed save is visible wherever she tapped it from. */}
            {error && (
              <p role="alert" className="mb-2 rounded-lg border border-terracotta-dark/40 bg-cream px-3 py-2 text-sm text-espresso">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={saving}
              className="min-h-12 w-full rounded-xl bg-terracotta-dark px-6 text-base text-cream transition-colors hover:bg-espresso disabled:opacity-60"
            >
              {saving ? progress ?? "Saving…" : "Save draft"}
            </button>
            {!saving && !cafeReady && (
              <p className="mt-2 text-center text-xs text-espresso-muted">Pick a cafe to save.</p>
            )}
          </div>
        </div>
      </form>
    </main>
  );
}
