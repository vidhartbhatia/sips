// design-rules: enforced
"use client";

import Link from "next/link";

interface PublishBarProps {
  status: "draft" | "published";
  /** The visit fields (or a drink row) have changes that aren't saved yet. */
  dirty: boolean;
  /** What's running right now, e.g. "Saving…"; null when idle. */
  busy: string | null;
  /** The last outcome, e.g. "Saved". */
  message: string | null;
  /** Why the last save or publish failed. */
  alert: string | null;
  previewHref: string;
  onPublish: () => void;
  onUnpublish: () => void;
}

const button =
  "flex min-h-12 items-center justify-center rounded-xl px-4 text-sm transition-colors disabled:opacity-60";

/**
 * The sticky bar at the bottom of the edit form: status, Save (the form's submit button),
 * Preview, and Publish or Unpublish. A failed publish shows its reason in an alert.
 */
export default function PublishBar({
  status,
  dirty,
  busy,
  message,
  alert,
  previewHref,
  onPublish,
  onUnpublish,
}: PublishBarProps) {
  const state = busy ?? (dirty ? "Unsaved changes" : message);
  return (
    <div className="sticky bottom-0 z-10 -mx-5 border-t border-espresso/[0.08] bg-cream/95 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-sm">
      {alert && (
        <p role="alert" className="mb-2 rounded-lg border border-terracotta-dark/40 bg-cream px-3 py-2 text-sm text-espresso">
          {alert}
        </p>
      )}
      <div className="mb-2 flex items-center justify-between gap-3 font-mono text-[11px] uppercase tracking-[0.15em]">
        <span className={status === "published" ? "text-espresso" : "text-espresso-muted"}>
          {status === "published" ? "Published" : "Draft"}
        </span>
        <span aria-live="polite" className="text-espresso-muted">
          {state}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <button
          type="submit"
          disabled={busy !== null}
          className={`${button} border border-espresso/[0.15] text-espresso hover:bg-stone`}
        >
          Save
        </button>
        {dirty || busy !== null ? (
          <span
            role="link"
            aria-disabled="true"
            aria-describedby="preview-hint"
            className={`${button} flex-col border border-espresso/[0.08] leading-tight text-espresso-muted`}
          >
            Preview
            <span id="preview-hint" className="text-[11px]">
              Save first
            </span>
          </span>
        ) : (
          <Link href={previewHref} className={`${button} border border-espresso/[0.15] text-espresso hover:bg-stone`}>
            Preview
          </Link>
        )}
        {status === "draft" ? (
          <button
            type="button"
            onClick={onPublish}
            disabled={busy !== null}
            className={`${button} bg-terracotta-dark text-cream hover:bg-espresso`}
          >
            Publish
          </button>
        ) : (
          <button
            type="button"
            onClick={onUnpublish}
            disabled={busy !== null}
            className={`${button} border border-terracotta-dark text-terracotta-dark hover:bg-stone`}
          >
            Unpublish
          </button>
        )}
      </div>
    </div>
  );
}
