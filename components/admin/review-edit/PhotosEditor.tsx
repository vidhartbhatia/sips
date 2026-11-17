// design-rules: enforced
"use client";

import { useState } from "react";
import Image from "next/image";
import PhotoPicker from "@/components/admin/capture/PhotoPicker";
import { addReviewPhoto, deletePhotoAction, setPhotoItem, updatePhotoCaption } from "@/lib/actions/photos";
import { setReviewCover } from "@/lib/actions/reviews";
import { resizeImage } from "@/lib/image-utils";
import { uploadQueue } from "@/lib/upload-queue";
import type { ConfirmRequest } from "./ConfirmDialog";

export interface EditPhoto {
  id: string;
  /** Signed URL for the thumbnail. */
  url: string;
  item_id: string | null;
  caption: string | null;
}

interface PhotosEditorProps {
  reviewId: string;
  photos: EditPhoto[];
  coverPhotoId: string | null;
  /** Saved drinks a photo can show. */
  drinks: { id: string; name: string }[];
  inputClass: string;
  askConfirm: (request: ConfirmRequest) => void;
  /** Reload the photos from the server (new signed URLs, new rows). */
  onChanged: () => void;
}

const MAX_CAPTION = 200;
const messageOf = (e: unknown) => (e instanceof Error ? e.message : String(e));

/**
 * The visit's photos. Uploads are resized in the browser and sent one per request. Every
 * other change (cover, linked drink, description, delete) saves as soon as it's made.
 */
export default function PhotosEditor({
  reviewId,
  photos,
  coverPhotoId,
  drinks,
  inputClass,
  askConfirm,
  onChanged,
}: PhotosEditorProps) {
  const [cover, setCover] = useState(coverPhotoId);
  const [coverError, setCoverError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string | null>(null);
  const [failures, setFailures] = useState<{ name: string; error: string }[]>([]);

  async function upload(files: File[]) {
    setFailures([]);
    const failed: { name: string; error: string }[] = [];
    try {
      for (const [i, file] of files.entries()) {
        setProgress(`Uploading photo ${i + 1} of ${files.length}…`);
        const result = await uploadQueue(
          [file],
          (blob) => {
            const form = new FormData();
            form.append("file", blob, blob instanceof File ? blob.name : "photo.jpg");
            return addReviewPhoto(reviewId, form);
          },
          resizeImage,
        );
        failed.push(...result.failures);
      }
    } finally {
      setProgress(null);
      setFailures(failed);
      onChanged();
    }
  }

  async function chooseCover(photoId: string) {
    const previous = cover;
    setCover(photoId);
    setCoverError(null);
    try {
      const result = await setReviewCover(reviewId, photoId);
      if (result.error) throw new Error(result.error);
    } catch (e) {
      setCover(previous);
      setCoverError(messageOf(e));
    }
  }

  return (
    <div className="space-y-4">
      {photos.length > 0 && cover === null && (
        <p className="text-sm text-espresso-muted">No cover picked, so the first photo is used.</p>
      )}
      {coverError && (
        <p role="alert" className="rounded-lg border border-terracotta-dark/40 px-3 py-2 text-sm text-espresso">
          {coverError}
        </p>
      )}

      {photos.length > 0 && (
        <ul className="grid gap-4 sm:grid-cols-2">
          {photos.map((photo, i) => (
            <PhotoCard
              key={photo.id}
              photo={photo}
              index={i + 1}
              isCover={cover === photo.id}
              onCover={() => void chooseCover(photo.id)}
              drinks={drinks}
              inputClass={inputClass}
              onDelete={() =>
                askConfirm({
                  title: "Delete this photo?",
                  body: "It's removed from the review and from storage. This can't be undone.",
                  confirmLabel: "Delete photo",
                  run: async () => {
                    const result = await deletePhotoAction(photo.id);
                    if (result.error) throw new Error(result.error);
                    if (cover === photo.id) setCover(null);
                    onChanged();
                  },
                })
              }
            />
          ))}
        </ul>
      )}

      {progress ? (
        <p aria-live="polite" className="flex min-h-12 items-center justify-center rounded-xl border border-dashed border-espresso/25 text-sm text-espresso">
          {progress}
        </p>
      ) : (
        <PhotoPicker
          files={[]}
          onChange={(files) => void upload(files)}
          label={photos.length === 0 ? "Add photos" : "Add more photos"}
          hint="Window light, no flash. Each photo is resized before it uploads."
        />
      )}

      {failures.length > 0 && (
        <div role="alert" className="rounded-lg border border-terracotta-dark/40 px-3 py-2 text-sm text-espresso">
          <p>{failures.length === 1 ? "One photo didn't upload:" : `${failures.length} photos didn't upload:`}</p>
          <ul className="mt-1 space-y-1">
            {failures.map((f, i) => (
              <li key={`${f.name}-${i}`}>
                <span className="font-medium">{f.name}</span>: {f.error}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

interface PhotoCardProps {
  photo: EditPhoto;
  index: number;
  isCover: boolean;
  onCover: () => void;
  drinks: { id: string; name: string }[];
  inputClass: string;
  onDelete: () => void;
}

function PhotoCard({ photo, index, isCover, onCover, drinks, inputClass, onDelete }: PhotoCardProps) {
  const [itemId, setItemId] = useState(photo.item_id);
  const [caption, setCaption] = useState(photo.caption ?? "");
  const [savedCaption, setSavedCaption] = useState(photo.caption ?? "");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const id = `photo-${photo.id}`;
  // A drink deleted since this photo was linked no longer exists: show "nothing".
  const shown = itemId && drinks.some((d) => d.id === itemId) ? itemId : "";

  async function link(next: string) {
    const previous = itemId;
    setItemId(next || null);
    setError(null);
    try {
      const result = await setPhotoItem(photo.id, next || null);
      if (result.error) throw new Error(result.error);
      setStatus("Saved");
    } catch (e) {
      setItemId(previous);
      setError(messageOf(e));
    }
  }

  async function saveCaption() {
    if (caption.trim() === savedCaption.trim()) return;
    setError(null);
    setStatus("Saving…");
    try {
      const result = await updatePhotoCaption(photo.id, caption);
      if (result.error) throw new Error(result.error);
      setSavedCaption(caption);
      setStatus("Saved");
    } catch (e) {
      setStatus(null);
      setError(messageOf(e));
    }
  }

  return (
    <li className="space-y-3 rounded-xl border border-espresso/[0.12] p-3">
      <div className="relative aspect-[3/2] overflow-hidden rounded-lg bg-stone">
        <Image
          src={photo.url}
          alt={savedCaption.trim()}
          fill
          // Fresh signed URL each render: skip the optimizer so tokens don't burn its quota.
          unoptimized
          className="object-cover"
          sizes="(min-width: 640px) 360px, 100vw"
        />
      </div>

      <div className="flex items-center justify-between gap-2">
        <label className="flex min-h-12 cursor-pointer items-center gap-2 text-sm text-espresso">
          <input
            type="radio"
            name="cover-photo"
            checked={isCover}
            onChange={onCover}
            className="h-5 w-5 accent-espresso"
          />
          Cover<span className="sr-only"> (photo {index})</span>
        </label>
        <button
          type="button"
          onClick={onDelete}
          className="min-h-12 rounded-lg px-3 text-sm text-terracotta-dark hover:bg-stone"
        >
          Delete<span className="sr-only"> photo {index}</span>
        </button>
      </div>

      <div>
        <label htmlFor={`${id}-item`} className="mb-1 block text-sm text-espresso-muted">
          Shows<span className="sr-only"> (photo {index})</span>
        </label>
        <select
          id={`${id}-item`}
          value={shown}
          onChange={(e) => void link(e.target.value)}
          className={inputClass}
        >
          <option value="">No particular drink</option>
          {drinks.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor={`${id}-caption`} className="mb-1 block text-sm text-espresso-muted">
          Describe this photo (for screen readers)
        </label>
        <input
          id={`${id}-caption`}
          type="text"
          value={caption}
          maxLength={MAX_CAPTION}
          onChange={(e) => setCaption(e.target.value)}
          onBlur={() => void saveCaption()}
          placeholder="e.g. A hojicha latte on a marble counter"
          className={inputClass}
        />
      </div>

      {error ? (
        <p role="alert" className="rounded-lg border border-terracotta-dark/40 px-3 py-2 text-sm text-espresso">
          {error}
        </p>
      ) : (
        status && (
          <p aria-live="polite" className="font-mono text-[11px] uppercase tracking-[0.15em] text-espresso-muted">
            {status}
          </p>
        )
      )}
    </li>
  );
}
