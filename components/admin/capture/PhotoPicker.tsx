"use client";

import { useEffect, useMemo, useRef } from "react";

interface PhotoPickerProps {
  files: File[];
  onChange: (files: File[]) => void;
  /** Visible button text. */
  label: string;
  multiple?: boolean;
  /** Shown under the button, e.g. photo guidance. */
  hint?: string;
}

/**
 * Pick photos from the library or the camera. No `capture` attribute, so iOS offers
 * Photo Library, Take Photo and Choose File. Previews are local object URLs; nothing is
 * uploaded until the draft is saved.
 */
export default function PhotoPicker({ files, onChange, label, multiple = true, hint }: PhotoPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const previews = useMemo(() => files.map((file) => URL.createObjectURL(file)), [files]);
  useEffect(() => () => previews.forEach((url) => URL.revokeObjectURL(url)), [previews]);

  function add(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    e.target.value = ""; // so picking the same photo again still fires
    if (picked.length === 0) return;
    onChange(multiple ? [...files, ...picked] : picked.slice(0, 1));
  }

  return (
    <div>
      {files.length > 0 && (
        <ul className="mb-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
          {files.map((file, i) => (
            <li key={`${file.name}-${i}`} className="relative aspect-square overflow-hidden rounded-lg bg-stone">
              {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview, not an optimizable URL */}
              <img src={previews[i]} alt="" className="h-full w-full object-cover" />
              {i === 0 && multiple && (
                <span className="absolute left-1.5 top-1.5 rounded bg-espresso/80 px-1.5 py-0.5 font-mono text-[11px] uppercase tracking-wider text-cream">
                  cover
                </span>
              )}
              <button
                type="button"
                onClick={() => onChange(files.filter((_, j) => j !== i))}
                aria-label={`Remove photo ${i + 1}`}
                className="absolute right-0 top-0 flex h-12 w-12 items-start justify-end p-1.5"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-espresso/80 text-sm text-cream">
                  &times;
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {(multiple || files.length === 0) && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex min-h-12 w-full items-center justify-center rounded-xl border border-dashed border-espresso/25 px-4 py-3 text-sm text-espresso transition-colors hover:border-espresso/50 hover:bg-stone/50"
        >
          {label}
        </button>
      )}
      {hint && <p className="mt-2 text-xs leading-relaxed text-espresso-muted">{hint}</p>}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        onChange={add}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
      />
    </div>
  );
}
