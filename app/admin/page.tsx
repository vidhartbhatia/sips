import Link from "next/link";
import { getAdminStats, getRecentDrafts, getRecentReviewsAdmin } from "@/lib/supabase/queries";
import SipsRating from "@/components/ui/SipsRating";

export const dynamic = "force-dynamic";

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider ${
        status === "published"
          ? "bg-sage/20 text-sage"
          : "bg-terracotta/10 text-terracotta"
      }`}
    >
      {status}
    </span>
  );
}

export default async function AdminDashboard() {
  const [stats, drafts, recentReviews] = await Promise.all([
    getAdminStats(),
    getRecentDrafts(),
    getRecentReviewsAdmin(),
  ]);

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      {/* Page heading */}
      <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-4xl text-espresso">Dashboard</h1>
          <p className="mt-1 font-display text-lg italic text-espresso-muted">
            manage your cafes & reviews
          </p>
        </div>

        <div className="flex gap-3">
          <Link
            href="/admin/quick-add"
            className="inline-flex items-center gap-2 rounded-xl bg-terracotta px-5 py-2.5 text-sm font-medium text-cream transition-colors hover:bg-terracotta-dark"
          >
            <span className="text-lg">+</span> Quick Add
          </Link>
          <Link
            href="/admin/review/new"
            className="inline-flex items-center gap-2 rounded-xl border border-espresso/[0.12] px-5 py-2.5 text-sm text-espresso transition-colors hover:bg-stone"
          >
            Full Review
          </Link>
        </div>
      </div>

      {/* Stats row */}
      <div className="mb-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Cafes", value: stats.totalCafes },
          { label: "Reviews", value: stats.totalReviews },
          { label: "Drafts", value: stats.draftCount },
          { label: "Photos", value: stats.photoCount },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-espresso/[0.08] bg-cream p-4 text-center"
          >
            <p className="font-heading text-3xl text-terracotta">
              {stat.value}
            </p>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-espresso-muted">
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-10 lg:grid-cols-2">
        {/* Drafts section */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-heading text-2xl text-espresso">Drafts</h2>
          </div>

          {drafts.length === 0 ? (
            <p className="text-sm text-espresso-muted">No drafts right now.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {drafts.map((draft) => (
                <Link
                  key={draft.id}
                  href={`/admin/review/${draft.id}/edit`}
                  className="rounded-xl border border-espresso/[0.08] bg-cream p-4 transition-colors hover:border-terracotta/20"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-medium text-espresso">
                        {draft.cafes?.name ?? "Unknown cafe"}
                      </h3>
                      <p className="font-mono text-[10px] uppercase tracking-wider text-espresso-muted">
                        visited {draft.date_visited}
                      </p>
                    </div>
                    {draft.overall_rating !== null && (
                      <SipsRating sips={draft.overall_rating} size={20} />
                    )}
                  </div>
                  {draft.note && (
                    <p className="mt-2 line-clamp-2 text-sm text-espresso-muted">
                      {draft.note}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Recent reviews section */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-heading text-2xl text-espresso">
              Recent Reviews
            </h2>
            <Link
              href="/admin/review/new"
              className="text-sm text-terracotta hover:text-terracotta-dark"
            >
              Write new &rarr;
            </Link>
          </div>

          {recentReviews.length === 0 ? (
            <p className="text-sm text-espresso-muted">No reviews yet.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {recentReviews.map((review) => (
                <Link
                  key={review.id}
                  href={`/admin/review/${review.id}/edit`}
                  className="rounded-xl border border-espresso/[0.08] bg-cream p-4 transition-colors hover:border-terracotta/20"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-medium text-espresso">
                        {review.cafes?.name ?? "Unknown cafe"}
                      </h3>
                      <p className="font-mono text-[10px] uppercase tracking-wider text-espresso-muted">
                        visited {review.date_visited}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={review.status} />
                      {review.overall_rating !== null && (
                        <SipsRating sips={review.overall_rating} size={20} />
                      )}
                    </div>
                  </div>
                  {review.note && (
                    <p className="mt-2 line-clamp-2 text-sm text-espresso-muted">
                      {review.note}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Quick links */}
      <div className="mt-10 flex gap-3">
        <Link
          href="/admin/cafes"
          className="rounded-xl border border-espresso/[0.08] px-4 py-2 text-sm text-espresso-muted transition-colors hover:border-terracotta/20 hover:text-terracotta"
        >
          All Cafes &rarr;
        </Link>
      </div>
    </main>
  );
}
