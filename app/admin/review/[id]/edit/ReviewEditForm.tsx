// design-rules: enforced
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ScoreInput from "@/components/admin/capture/ScoreInput";
import ConfirmDialog, { type ConfirmRequest } from "@/components/admin/review-edit/ConfirmDialog";
import DrinksEditor from "@/components/admin/review-edit/DrinksEditor";
import PhotosEditor, { type EditPhoto } from "@/components/admin/review-edit/PhotosEditor";
import PublishBar from "@/components/admin/review-edit/PublishBar";
import { rowIsDirty, useDrinkRows, type DrinkRow, type SavedItem } from "@/components/admin/review-edit/useDrinkRows";
import { saveAndPublishReview, unpublishReview, updateReview } from "@/lib/actions/reviews";
import { deleteReview } from "@/lib/actions/admin";

export interface ReviewEditFormProps {
  review: {
    id: string;
    status: "draft" | "published";
    overall_rating: number | null;
    verdict: string | null;
    note: string | null;
    date_visited: string;
    cover_photo_id: string | null;
    cafe: { name: string; neighborhood: string } | null;
    /** Oldest first. */
    items: SavedItem[];
    /** Oldest first, with signed URLs. */
    photos: EditPhoto[];
  };
}

/** The visit fields that Save and Publish send. */
interface VisitFields {
  overall_rating: number | null;
  verdict: string;
  note: string;
  date_visited: string;
}

const inputClass =
  "w-full min-h-12 rounded-xl border border-espresso/[0.15] bg-cream px-4 py-3 text-base text-espresso placeholder:text-espresso-muted focus:border-espresso focus:outline-none focus:ring-1 focus:ring-espresso/30";

const sameVisit = (a: VisitFields, b: VisitFields) =>
  a.overall_rating === b.overall_rating &&
  a.verdict === b.verdict &&
  a.note === b.note &&
  a.date_visited === b.date_visited;

const messageOf = (e: unknown) => (e instanceof Error ? e.message : String(e));

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
 * Edit a visit after capture: the visit fields (saved with Save, or with Publish), its drinks
 * and photos (each saved as it changes), and its status. Stays on the page after saving.
 */
export default function ReviewEditForm({ review }: ReviewEditFormProps) {
  const router = useRouter();

  const [status, setStatusState] = useState(review.status);
  // The drink rows read the status after an await, so it's mirrored in a ref.
  const statusRef = useRef(review.status);
  const setStatus = (next: "draft" | "published") => {
    statusRef.current = next;
    setStatusState(next);
  };
  const drinks = useDrinkRows(review.id, () => statusRef.current, review.items);

  const initial: VisitFields = {
    overall_rating: review.overall_rating,
    verdict: review.verdict ?? "",
    note: review.note ?? "",
    date_visited: review.date_visited,
  };
  const [fields, setFields] = useState(initial);
  // The latest fields, for Save and Publish to read after waiting on the drink rows.
  const fieldsRef = useRef(initial);
  // What the server has for the visit fields, to tell whether there's anything to save.
  const [baseline, setBaseline] = useState(initial);
  const set = (patch: Partial<VisitFields>) => {
    fieldsRef.current = { ...fieldsRef.current, ...patch };
    setFields(fieldsRef.current);
  };

  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [alert, setAlert] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<ConfirmRequest | null>(null);
  const [confirmBusy, setConfirmBusy] = useState(false);

  const dirty = !sameVisit(fields, baseline) || drinks.rows.some(rowIsDirty);

  // Warn before leaving with unsaved visit fields (drinks and photos save as they change).
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  /** Save the drink rows still open; returns an alert when one can't be saved. */
  async function flushDrinks(action: string): Promise<string | null> {
    const unsaved = await drinks.flush();
    if (unsaved.length === 0) return null;
    return `Couldn't save ${unsaved.join(", ")}. Fix the drink marked below, then ${action} again.`;
  }

  async function run(label: string, task: () => Promise<void>) {
    setBusy(label);
    setAlert(null);
    setMessage(null);
    try {
      await task();
    } catch (e) {
      setAlert(messageOf(e));
    } finally {
      setBusy(null);
    }
  }

  const save = () =>
    run("Saving…", async () => {
      const drinkAlert = await flushDrinks("save");
      const sent = fieldsRef.current;
      const result = await updateReview(review.id, sent);
      if (result.error) return setAlert(result.error);
      setBaseline(sent);
      if (drinkAlert) return setAlert(drinkAlert);
      setMessage("Saved");
    });

  const publish = () =>
    run("Publishing…", async () => {
      const drinkAlert = await flushDrinks("publish");
      if (drinkAlert) return setAlert(drinkAlert);
      const sent = fieldsRef.current;
      const result = await saveAndPublishReview(review.id, sent);
      if (result.error) return setAlert(result.error);
      setBaseline(sent);
      setStatus("published");
      setMessage("Published");
      router.refresh();
    });

  const askUnpublish = () =>
    setConfirm({
      title: "Unpublish this review?",
      body: "It comes off the site and out of the cafe's score, and goes back to being a draft.",
      confirmLabel: "Unpublish",
      run: () =>
        run("Unpublishing…", async () => {
          const result = await unpublishReview(review.id);
          if (result.error) return setAlert(result.error);
          setStatus("draft");
          setMessage("Unpublished");
          router.refresh();
        }),
    });

  const askDelete = () =>
    setConfirm({
      title: "Delete this review?",
      body: "This permanently deletes the review, its drinks and its photos.",
      confirmLabel: "Delete review",
      run: async () => {
        // On success the action redirects to the dashboard.
        const result = await deleteReview(review.id);
        if (result?.error) throw new Error(result.error);
      },
    });

  const askRemoveDrink = (row: DrinkRow) => {
    if (!row.id) return void drinks.remove(row.key);
    setConfirm({
      title: `Remove ${row.values.name.trim() || "this drink"}?`,
      body: "Its photos stay with the review, just not linked to a drink.",
      confirmLabel: "Remove",
      run: async () => {
        if (await drinks.remove(row.key)) router.refresh();
      },
    });
  };

  async function confirmNow() {
    if (!confirm) return;
    setConfirmBusy(true);
    try {
      await confirm.run();
    } catch (e) {
      setAlert(messageOf(e));
    } finally {
      setConfirmBusy(false);
      setConfirm(null);
    }
  }

  const savedDrinks = drinks.rows.flatMap((row) =>
    row.id && row.saved ? [{ id: row.id, name: row.saved.name }] : [],
  );

  return (
    <>
      <Link href="/admin" className="flex min-h-12 items-center text-sm text-espresso-muted hover:text-espresso">
        &larr; Dashboard
      </Link>
      <h1 className="font-heading text-5xl text-espresso">{review.cafe?.name ?? "Unknown cafe"}</h1>
      {review.cafe?.neighborhood && (
        <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.2em] text-espresso-muted">
          {review.cafe.neighborhood}
        </p>
      )}

      <form
        className="mt-8 space-y-10"
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
      >
        <Section title="Visit">
          <div>
            <label htmlFor="date-visited" className="mb-1 block text-sm text-espresso-muted">
              Visited
            </label>
            <input
              id="date-visited"
              type="date"
              value={fields.date_visited}
              onChange={(e) => set({ date_visited: e.target.value })}
              className={inputClass}
              required
            />
          </div>
          <div>
            <span className="mb-1 block text-sm text-espresso-muted" aria-hidden="true">
              Overall score
            </span>
            <ScoreInput
              value={fields.overall_rating}
              onChange={(overall_rating) => set({ overall_rating })}
              label="Overall score"
            />
          </div>
          <div>
            <label htmlFor="verdict" className="mb-1 block text-sm text-espresso-muted">
              Verdict
            </label>
            <input
              id="verdict"
              type="text"
              value={fields.verdict}
              maxLength={140}
              onChange={(e) => set({ verdict: e.target.value })}
              aria-describedby="verdict-hint"
              className={`${inputClass} font-display text-lg italic`}
            />
            <p id="verdict-hint" className="mt-1 text-xs text-espresso-muted">
              One line, the way you&rsquo;d say it to a friend.
            </p>
          </div>
          <div>
            <label htmlFor="story" className="mb-1 block text-sm text-espresso-muted">
              Story
            </label>
            <textarea
              id="story"
              value={fields.note}
              onChange={(e) => set({ note: e.target.value })}
              rows={8}
              aria-describedby="story-hint"
              className={`${inputClass} resize-y`}
            />
            <p id="story-hint" className="mt-1 text-xs text-espresso-muted">
              1–4 short paragraphs. Leave a blank line between paragraphs.
            </p>
          </div>
        </Section>

        <Section title="What we tried">
          <DrinksEditor
            rows={drinks.rows}
            inputClass={inputClass}
            onAdd={drinks.add}
            onChange={drinks.change}
            onSave={(key) => void drinks.save(key)}
            onRemove={askRemoveDrink}
          />
        </Section>

        <Section title="Photos">
          <PhotosEditor
            reviewId={review.id}
            photos={review.photos}
            coverPhotoId={review.cover_photo_id}
            drinks={savedDrinks}
            inputClass={inputClass}
            askConfirm={setConfirm}
            onChanged={() => router.refresh()}
          />
        </Section>

        <PublishBar
          status={status}
          dirty={dirty}
          busy={busy}
          message={message}
          alert={alert}
          previewHref={`/admin/review/${review.id}/preview`}
          onPublish={() => void publish()}
          onUnpublish={askUnpublish}
        />
      </form>

      <div className="mt-12 border-t border-espresso/[0.08] pt-6">
        <button
          type="button"
          onClick={askDelete}
          className="min-h-12 rounded-xl border border-terracotta-dark/40 px-6 text-sm text-terracotta-dark hover:bg-stone"
        >
          Delete this review
        </button>
      </div>

      <ConfirmDialog
        request={confirm}
        busy={confirmBusy}
        onConfirm={() => void confirmNow()}
        onCancel={() => setConfirm(null)}
      />
    </>
  );
}
