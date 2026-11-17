// design-rules: enforced
"use client";

import { useEffect, useRef } from "react";

/** A destructive step waiting for a yes. `run` does the work once confirmed. */
export interface ConfirmRequest {
  title: string;
  body: string;
  confirmLabel: string;
  run: () => Promise<void>;
}

interface ConfirmDialogProps {
  request: ConfirmRequest | null;
  busy: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** A modal yes/no on the native <dialog>: focus trap, Escape and backdrop come with it. */
export default function ConfirmDialog({ request, busy, onConfirm, onCancel }: ConfirmDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (request && !dialog.open) dialog.showModal();
    if (!request && dialog.open) dialog.close();
  }, [request]);

  return (
    <dialog
      ref={ref}
      aria-labelledby="confirm-title"
      onCancel={(e) => {
        e.preventDefault();
        if (!busy) onCancel();
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-2xl border border-espresso/[0.08] bg-cream p-6 text-espresso backdrop:bg-espresso/40"
    >
      {request && (
        <>
          <h2 id="confirm-title" className="font-heading text-3xl text-espresso">
            {request.title}
          </h2>
          <p className="mt-2 text-sm text-espresso-muted">{request.body}</p>
          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={busy}
              className="min-h-12 flex-1 rounded-xl border border-espresso/[0.15] text-sm text-espresso hover:bg-stone disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={busy}
              className="min-h-12 flex-1 rounded-xl bg-terracotta-dark text-sm text-cream hover:bg-espresso disabled:opacity-60"
            >
              {busy ? "Working…" : request.confirmLabel}
            </button>
          </div>
        </>
      )}
    </dialog>
  );
}
