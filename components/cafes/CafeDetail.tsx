"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SipsRating, { SipsCup, SipsLabel } from "@/components/ui/SipsRating";
import InkDivider from "@/components/ui/InkDivider";

interface CafeItem {
  name: string;
  type: string | null;
  rating: number | null;
  is_favorite: boolean;
  notes?: string | null;
}

interface CafeReview {
  id: string;
  date_visited: string;
  overall_rating: number | null;
  note: string | null;
  author?: { display_name: string | null } | null;
}

interface CafePhoto {
  id: string;
  photo_url: string;
}

interface Cafe {
  name: string;
  slug: string;
  neighborhood: string;
  address: string;
  overall_rating: number | null;
  cover_photo_url?: string | null;
  vibe_tags: string[];
  reviews: CafeReview[];
  items: CafeItem[];
  photos: CafePhoto[];
}

interface ReviewBylineProps {
  name: string | null | undefined;
}

/** "— V." signature under a review (ship-plan R7). Unattributed reviews show nothing. */
function ReviewByline({ name }: ReviewBylineProps) {
  const trimmed = name?.trim();
  if (!trimmed) return null;
  return (
    <p className="mt-2 text-right font-heading text-2xl leading-none text-espresso-muted">
      — {trimmed}
    </p>
  );
}

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function CafeDetail({ cafe }: { cafe: Cafe }) {
  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <Header />
      <main className="mx-auto max-w-4xl flex-1 px-6 py-12">
        {/* Back link */}
        <Link
          href="/cafes"
          className="mb-6 inline-block text-sm text-espresso-muted hover:text-terracotta"
        >
          &larr; All Cafes
        </Link>

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {cafe.cover_photo_url ? (
            <div className="relative aspect-[16/7] overflow-hidden rounded-xl">
              <Image
                src={cafe.cover_photo_url}
                alt={cafe.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 896px"
              />
            </div>
          ) : (
            <div className="aspect-[16/7] overflow-hidden rounded-xl bg-gradient-to-br from-sage/30 via-pink/20 to-terracotta/10" />
          )}

          <div className="mt-6">
            <h1 className="font-heading text-5xl text-espresso">
              {cafe.name}
            </h1>
            <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.2em] text-espresso-muted">
              {cafe.neighborhood} &middot; {cafe.address}
            </p>
          </div>
        </motion.div>

        {/* Rating + Tags */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-8 flex flex-wrap items-center gap-6"
        >
          <div className="flex items-center gap-3">
            <SipsCup sips={cafe.overall_rating ?? 0} size={64} />
            <div>
              <SipsLabel sips={cafe.overall_rating ?? 0} className="text-xl" />
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-espresso-muted">
                overall
              </p>
            </div>
          </div>
          {cafe.vibe_tags && cafe.vibe_tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {cafe.vibe_tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-espresso/[0.1] px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-espresso-muted"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </motion.div>

        <InkDivider className="my-10 text-espresso" />

        {/* Items */}
        {cafe.items && cafe.items.length > 0 && (
          <motion.section variants={stagger} initial="hidden" animate="show">
            <h2 className="font-heading text-3xl text-espresso">
              What We Tried
            </h2>
            <div className="mt-6 space-y-4">
              {cafe.items.map((it) => (
                <motion.div
                  key={it.name}
                  variants={fadeUp}
                  className="flex items-center justify-between border-b border-espresso/[0.08] pb-3"
                >
                  <div className="flex items-center gap-3">
                    {it.is_favorite && (
                      <span className="text-lg text-terracotta">&hearts;</span>
                    )}
                    <div>
                      <span className="text-base font-medium text-espresso">
                        {it.name}
                      </span>
                      {it.type && (
                        <span className="ml-2 font-mono text-[11px] uppercase tracking-[0.2em] text-espresso-muted">
                          {it.type}
                        </span>
                      )}
                      {it.notes && (
                        <p className="mt-0.5 text-sm text-espresso-muted">
                          {it.notes}
                        </p>
                      )}
                    </div>
                  </div>
                  {it.rating !== null && <SipsRating sips={it.rating} size={22} />}
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}

        {/* Photos Gallery */}
        {cafe.photos && cafe.photos.length > 0 && (
          <>
            <InkDivider className="my-10 text-espresso" />
            <motion.section variants={stagger} initial="hidden" animate="show">
              <h2 className="font-heading text-3xl text-espresso">Photos</h2>
              <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3">
                {cafe.photos.map((photo) => (
                  <motion.a
                    key={photo.id}
                    variants={fadeUp}
                    href={photo.photo_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative aspect-square overflow-hidden rounded-xl"
                  >
                    <Image
                      src={photo.photo_url}
                      alt={`Photo of ${cafe.name}`}
                      fill
                      className="object-cover transition-transform hover:scale-105"
                      sizes="(max-width: 768px) 50vw, 300px"
                    />
                  </motion.a>
                ))}
              </div>
            </motion.section>
          </>
        )}

        <InkDivider className="my-10 text-espresso" />

        {/* Reviews */}
        {cafe.reviews && cafe.reviews.length > 0 && (
          <motion.section variants={stagger} initial="hidden" animate="show">
            <h2 className="font-heading text-3xl text-espresso">
              Our Visits
            </h2>
            <div className="mt-6 space-y-6">
              {cafe.reviews.map((review) => (
                <motion.div
                  key={review.id}
                  variants={fadeUp}
                  className="rounded-xl border border-espresso/[0.08] bg-cream p-5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-espresso-muted">
                      visited {review.date_visited}
                    </span>
                    {review.overall_rating !== null && (
                      <SipsRating sips={review.overall_rating} size={22} />
                    )}
                  </div>
                  {review.note && (
                    <p className="mt-3 leading-relaxed text-espresso-muted">
                      {review.note}
                    </p>
                  )}
                  <ReviewByline name={review.author?.display_name} />
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}
      </main>
      <Footer />
    </div>
  );
}
