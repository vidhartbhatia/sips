"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import SipsRating from "@/components/ui/SipsRating";
import CafePlaceholder from "@/components/ui/CafePlaceholder";
import { useMotionSafe } from "@/lib/motion";

interface Cafe {
  name: string;
  slug: string;
  neighborhood: string;
  overall_rating: number | null;
  vibe_tags: string[];
  cover_photo_url: string | null;
}

export default function CafeGrid({ cafes }: { cafes: Cafe[] }) {
  const { shouldReduce } = useMotionSafe();
  const [search, setSearch] = useState("");
  const [neighborhood, setNeighborhood] = useState("All");
  const [minRating, setMinRating] = useState(0);

  const neighborhoods = useMemo(() => {
    const unique = Array.from(new Set(cafes.map((c) => c.neighborhood))).sort();
    return ["All", ...unique];
  }, [cafes]);

  const filtered = cafes.filter((cafe) => {
    if (search && !cafe.name.toLowerCase().includes(search.toLowerCase()))
      return false;
    if (neighborhood !== "All" && cafe.neighborhood !== neighborhood)
      return false;
    if (cafe.overall_rating !== null && cafe.overall_rating < minRating)
      return false;
    if (cafe.overall_rating === null && minRating > 1) return false;
    return true;
  });

  const container = shouldReduce
    ? { hidden: { opacity: 1 }, show: { opacity: 1 } }
    : { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };

  const item = shouldReduce
    ? { hidden: { opacity: 1 }, show: { opacity: 1 } }
    : { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

  return (
    <>
      {/* Filters */}
      <div className="mt-8 flex flex-wrap items-end gap-4">
        <div className="min-w-[200px] flex-1">
          <label className="mb-1 block font-mono text-[11px] uppercase tracking-[0.2em] text-espresso-muted">
            Search
          </label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or neighborhood..."
            className="w-full rounded-lg border border-espresso/[0.12] bg-cream px-3 py-2 text-espresso placeholder:text-espresso-muted/50 focus:border-terracotta focus:outline-none focus:ring-1 focus:ring-terracotta/30"
          />
        </div>
        <div>
          <label className="mb-1 block font-mono text-[11px] uppercase tracking-[0.2em] text-espresso-muted">
            Neighborhood
          </label>
          <select
            value={neighborhood}
            onChange={(e) => setNeighborhood(e.target.value)}
            className="rounded-lg border border-espresso/[0.12] bg-cream px-3 py-2 text-espresso focus:border-terracotta focus:outline-none"
          >
            {neighborhoods.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block font-mono text-[11px] uppercase tracking-[0.2em] text-espresso-muted">
            Min rating
          </label>
          <select
            value={minRating}
            onChange={(e) => setMinRating(Number(e.target.value))}
            className="rounded-lg border border-espresso/[0.12] bg-cream px-3 py-2 text-espresso focus:border-terracotta focus:outline-none"
          >
            <option value={0}>All</option>
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n}+ sips
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="mt-16 py-8 text-center">
          <Image
            src="/illustrations/coffee-cup.svg"
            alt=""
            width={56}
            height={56}
            className="mx-auto mb-4 opacity-25"
          />
          <h3 className="font-heading text-2xl text-espresso">
            No cafes found
          </h3>
          <p className="mt-2 text-sm text-espresso-muted">
            Try a different neighborhood or rating
          </p>
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setNeighborhood("All");
              setMinRating(0);
            }}
            className="mt-4 font-heading text-base text-terracotta hover:text-terracotta-dark hover:underline"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          key={`${search}-${neighborhood}-${minRating}`}
          className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {filtered.map((cafe) => (
            <motion.div key={cafe.slug} variants={item}>
              <Link
                href={`/cafes/${cafe.slug}`}
                className="block rounded-xl border border-espresso/[0.08] bg-cream p-5 transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                {cafe.cover_photo_url ? (
                  <Image
                    src={cafe.cover_photo_url}
                    alt={cafe.name}
                    width={400}
                    height={300}
                    className="aspect-[4/3] w-full rounded-lg object-cover"
                  />
                ) : (
                  <CafePlaceholder cafeName={cafe.name} />
                )}
                <div className="mt-4">
                  <h3 className="font-heading text-xl text-espresso">
                    {cafe.name}
                  </h3>
                  <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.2em] text-espresso-muted">
                    {cafe.neighborhood}
                  </p>
                  {cafe.overall_rating !== null && (
                    <div className="mt-3">
                      <SipsRating sips={cafe.overall_rating} size={24} />
                    </div>
                  )}
                  {cafe.vibe_tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {cafe.vibe_tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-espresso/[0.1] px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-espresso-muted"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      )}
    </>
  );
}
