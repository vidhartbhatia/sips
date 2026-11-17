import Link from "next/link";
import { getAllCafesAdmin } from "@/lib/supabase/queries";
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

export default async function AdminCafes() {
  const cafes = await getAllCafesAdmin();

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      {/* Heading */}
      <div className="mb-8">
        <Link
          href="/admin"
          className="mb-2 inline-block text-sm text-espresso-muted hover:text-terracotta"
        >
          &larr; Dashboard
        </Link>
        <h1 className="font-heading text-4xl text-espresso">All Cafes</h1>
        <p className="mt-1 font-display text-lg italic text-espresso-muted">
          {cafes.length} cafes tracked so far
        </p>
      </div>

      {/* Cafe list */}
      {cafes.length === 0 ? (
        <p className="text-sm text-espresso-muted">
          No cafes yet. Add one from a review!
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {cafes.map((cafe) => (
            <Link
              key={cafe.id}
              href={`/admin/cafes/${cafe.slug}/edit`}
              className="rounded-xl border border-espresso/[0.08] bg-cream p-5 transition-colors hover:border-terracotta/20"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h2 className="text-base font-medium text-espresso">
                      {cafe.name}
                    </h2>
                    <StatusBadge status={cafe.status} />
                  </div>
                  <p className="mt-1 text-sm text-espresso-muted">
                    {cafe.address}
                  </p>
                  <div className="mt-2 flex items-center gap-3">
                    <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-espresso-muted">
                      {cafe.neighborhood}
                    </span>
                    {cafe.overall_rating != null && cafe.overall_rating > 0 && (
                      <>
                        <span className="text-espresso/20">|</span>
                        <SipsRating sips={cafe.overall_rating} size={20} />
                      </>
                    )}
                  </div>
                </div>

                <span className="text-sm text-espresso-muted hover:text-terracotta">
                  Edit &rarr;
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
