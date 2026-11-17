"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SipsRating from "@/components/ui/SipsRating";
import InkDivider from "@/components/ui/InkDivider";
import CafePlaceholder from "@/components/ui/CafePlaceholder";
import { useMotionSafe } from "@/lib/motion";

type Cafe = {
  name: string;
  slug: string;
  neighborhood: string;
  overall_rating: number | null;
  vibe_tags: string[];
  cover_photo_url: string | null;
};

export default function HomeContent({ cafes }: { cafes: Cafe[] }) {
  const { safeTransition } = useMotionSafe();

  const fade = {
    initial: { opacity: 0, y: 16 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: safeTransition({ duration: 0.5 }),
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="px-6 py-20 md:py-28">
          <div className="mx-auto max-w-5xl">
            <div className="flex flex-col items-center gap-10 md:flex-row md:items-center md:justify-between">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={safeTransition({ duration: 0.6 })}
                className="max-w-lg text-center md:text-left"
              >
                <h1 className="font-heading text-6xl text-espresso md:text-7xl">
                  Sips
                </h1>
                <p className="mt-3 font-display text-2xl italic text-terracotta">
                  a seattle cafe journal
                </p>
                <p className="mx-auto mt-6 max-w-md text-base leading-relaxed text-espresso-muted md:mx-0">
                  Two coffee &amp; matcha lovers exploring Seattle&apos;s cafe
                  scene, one cup at a time. Honest reviews, hand-drawn ratings,
                  and a whole lot of lattes.
                </p>

                <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row md:items-start">
                  <Link
                    href="/cafes"
                    className="rounded-xl bg-terracotta px-8 py-3 text-base text-cream transition-all hover:bg-terracotta-dark hover:shadow-lg"
                  >
                    Browse Cafes
                  </Link>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={safeTransition({ duration: 0.8, delay: 0.2 })}
              >
                <Image
                  src="/illustrations/cafe-scene.svg"
                  alt="Cafe table illustration"
                  width={400}
                  height={400}
                  className="w-[280px] md:w-[380px]"
                />
              </motion.div>
            </div>
          </div>
        </section>

        <InkDivider className="text-espresso" />

        {/* Recent Reviews Preview */}
        <section className="px-6 py-16">
          <div className="mx-auto max-w-6xl">
            <motion.div {...fade}>
              <span className="block text-center font-mono text-[11px] uppercase tracking-[0.2em] text-espresso-muted">
                Latest
              </span>
              <h2 className="mt-2 text-center font-heading text-4xl text-espresso">
                Recent Sips
              </h2>
            </motion.div>

            {cafes.length > 0 ? (
              <>
                <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {cafes.map((cafe, i) => (
                    <Link key={cafe.slug} href={`/cafes/${cafe.slug}`}>
                      <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={safeTransition({ delay: i * 0.1, duration: 0.5 })}
                        className="group cursor-pointer rounded-xl border border-espresso/[0.08] bg-cream p-5 transition-all hover:-translate-y-0.5 hover:shadow-md"
                      >
                        {cafe.cover_photo_url ? (
                          <div className="relative aspect-[4/3] overflow-hidden rounded-lg">
                            <Image
                              src={cafe.cover_photo_url}
                              alt={cafe.name}
                              fill
                              className="object-cover"
                              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            />
                          </div>
                        ) : (
                          <CafePlaceholder cafeName={cafe.name} />
                        )}
                        <div className="mt-4">
                          <h3 className="font-heading text-xl text-espresso group-hover:text-terracotta">
                            {cafe.name}
                          </h3>
                          <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.2em] text-espresso-muted">
                            {cafe.neighborhood}
                          </p>
                          {cafe.overall_rating != null && (
                            <div className="mt-2">
                              <SipsRating sips={cafe.overall_rating} size={24} />
                            </div>
                          )}
                        </div>
                      </motion.div>
                    </Link>
                  ))}
                </div>

                <div className="mt-10 text-center">
                  <Link
                    href="/cafes"
                    className="text-sm text-terracotta transition-colors hover:text-terracotta-dark"
                  >
                    see all cafes &rarr;
                  </Link>
                </div>
              </>
            ) : (
              <div className="mt-12 py-12 text-center">
                <Image
                  src="/illustrations/coffee-cup.svg"
                  alt=""
                  width={64}
                  height={64}
                  className="mx-auto mb-4 opacity-30"
                />
                <p className="font-heading text-2xl text-espresso">
                  First reviews soon.
                </p>
              </div>
            )}
          </div>
        </section>

        <InkDivider className="text-espresso" />

        {/* About teaser */}
        <section className="px-6 py-16">
          <div className="mx-auto max-w-2xl text-center">
            <motion.div {...fade}>
              <p className="font-display text-2xl italic leading-relaxed text-espresso-muted">
                &ldquo;We believe the best cafes aren&apos;t just about the
                coffee &mdash; they&apos;re about the feeling you get when you
                walk through the door.&rdquo;
              </p>
              <Link
                href="/about"
                className="mt-6 inline-block text-sm text-terracotta transition-colors hover:text-terracotta-dark"
              >
                learn more about us &rarr;
              </Link>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
