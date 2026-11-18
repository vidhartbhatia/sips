// design-rules: enforced
import Link from "next/link";

interface PreviewBannerProps {
  reviewId: string;
  isDraft: boolean;
  blocker: string | null;
}

/** The admin preview's banner: draft or published, why it can't publish yet, and a way back to the form. */
export function PreviewBanner({ reviewId, isDraft, blocker }: PreviewBannerProps) {
  return (
    <div
      role="status"
      className="mb-6 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 rounded-md bg-stone px-4 py-3 text-sm text-espresso"
    >
      <div className="space-y-1">
        <p className="font-semibold">{isDraft ? "Draft preview: only you can see this." : "Published version"}</p>
        {blocker && <p className="text-espresso-muted">{blocker}</p>}
      </div>
      <Link
        href={`/admin/review/${reviewId}/edit`}
        // A prefetch of the form is wasted work, and on the fixture route (logged out) it
        // only fetches the /login redirect.
        prefetch={false}
        className="font-medium text-terracotta-dark underline decoration-1 underline-offset-4 hover:decoration-2"
      >
        Edit
      </Link>
    </div>
  );
}
