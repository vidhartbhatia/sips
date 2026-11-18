"use client";

import { motion } from "framer-motion";
import { Illustration } from "@/components/ui/Illustration";
import { DOODLES, ORNAMENTS, type DoodleSlot, type OrnamentSlot } from "@/lib/illustrations";
import { SipsCup, SipsLabel } from "@/components/ui/SipsRating";
import SipsRating from "@/components/ui/SipsRating";

const fade = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5 },
};

function InkDivider({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 800 24"
      fill="none"
      className={`w-full ${className}`}
      preserveAspectRatio="none"
    >
      <path
        d="M0,12 C50,6 120,18 200,10 C280,2 340,20 420,12 C500,4 560,18 640,8 C720,-2 760,16 800,12"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.12"
        fill="none"
      />
    </svg>
  );
}

export default function DesignSystemPage() {
  return (
    <div className="min-h-screen bg-cream text-espresso">
      {/* ─── HEADER ─── */}
      <header className="border-b border-espresso/[0.06]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <Illustration slot="logo" className="h-7 w-auto" />
            <span className="font-heading text-2xl text-espresso">Sips</span>
          </div>
          <nav className="flex items-center gap-8">
            {["Map", "Cafes", "Blog", "Wish List", "About"].map((item) => (
              <span
                key={item}
                className="cursor-pointer text-sm text-espresso-muted transition-colors hover:text-terracotta"
              >
                {item}
              </span>
            ))}
          </nav>
        </div>
      </header>

      <main>
        {/* ─── HERO ─── */}
        <section className="px-6 py-24 md:py-32">
          <div className="mx-auto max-w-5xl">
            <div className="flex flex-col items-start gap-12 md:flex-row md:items-center md:justify-between">
              <motion.div {...fade} className="max-w-lg">
                <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-espresso-muted">
                  Design System
                </span>
                <h1 className="mt-4 font-heading text-7xl leading-[0.95] text-espresso md:text-8xl">
                  Ink &amp;
                  <br />
                  Paper
                </h1>
                <p className="mt-6 font-display text-2xl italic text-terracotta">
                  clean lines, warm tones, hand-drawn soul
                </p>
                <p className="mt-4 max-w-md text-base leading-relaxed text-espresso-muted">
                  A modern editorial aesthetic with hand-drawn ink illustrations
                  as signature accents. Confident, warm, personal — like a
                  well-designed cafe journal.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <Illustration
                  slot="hero"
                  alt="Watercolour of a Seattle cafe table"
                  className="h-auto w-[320px] md:w-[400px]"
                />
              </motion.div>
            </div>
          </div>
        </section>

        <InkDivider className="text-espresso" />

        {/* ─── ILLUSTRATION LIBRARY ─── */}
        <section className="px-6 py-20">
          <div className="mx-auto max-w-5xl">
            <motion.div {...fade}>
              <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-espresso-muted">
                01 &mdash; Illustrations
              </span>
              <h2 className="mt-3 font-heading text-4xl text-espresso">
                The ink family
              </h2>
              <p className="mt-2 font-heading text-xl text-espresso-muted">
                clean hand-drawn ink, consistent across the whole site
              </p>
            </motion.div>

            {/* Individual illustrations */}
            <motion.div {...fade} className="mt-12">
              <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-terracotta">
                Drink doodles
              </span>
              <div className="mt-6 flex flex-wrap items-end gap-10">
                {(Object.keys(DOODLES) as DoodleSlot[]).map((slot) => (
                  <div
                    key={slot}
                    className="flex flex-col items-center gap-3"
                  >
                    <div className="flex h-28 items-end">
                      <Illustration slot={slot} alt={slot} className="h-24 w-auto" />
                    </div>
                    <span className="font-heading text-sm text-espresso-muted">
                      {slot}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Decorative */}
            <motion.div {...fade} className="mt-14">
              <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-terracotta">
                Page art &amp; ornaments
              </span>
              <div className="mt-6 flex flex-wrap items-end gap-12">
                {(["logo", "empty", "404", "about", ...(Object.keys(ORNAMENTS) as OrnamentSlot[])] as const).map((slot) => (
                  <div
                    key={slot}
                    className="flex flex-col items-center gap-3"
                  >
                    <div className="flex h-32 items-end">
                      <Illustration slot={slot} alt={slot} className="h-auto max-h-32 w-32 object-contain" />
                    </div>
                    <span className="font-heading text-sm text-espresso-muted">
                      {slot}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        <InkDivider className="text-espresso" />

        {/* ─── TYPOGRAPHY ─── */}
        <section className="px-6 py-20 bg-stone">
          <div className="mx-auto max-w-5xl">
            <motion.div {...fade}>
              <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-espresso-muted">
                02 &mdash; Typography
              </span>
            </motion.div>

            <motion.div {...fade} className="mt-10 space-y-14">
              <div>
                <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-terracotta">
                  Heading &mdash; Instrument Serif
                </span>
                <h2 className="mt-3 font-heading text-6xl leading-[1.05] text-espresso">
                  Every cup
                  <br />
                  tells a story
                </h2>
              </div>

              <div>
                <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-terracotta">
                  Hand &mdash; Caveat
                </span>
                <p className="mt-3 font-heading text-4xl text-espresso">
                  the oat milk latte was incredible &mdash; we&apos;ll be back
                </p>
              </div>

              <div>
                <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-terracotta">
                  Body &mdash; Plus Jakarta Sans
                </span>
                <p className="mt-3 max-w-lg text-lg leading-relaxed text-espresso">
                  Two coffee &amp; matcha lovers exploring Seattle&apos;s cafe
                  scene, one cup at a time. Honest ratings, hand-drawn reviews,
                  and a whole lot of lattes.
                </p>
              </div>

              <div>
                <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-terracotta">
                  Mono &mdash; IBM Plex Mono
                </span>
                <div className="mt-3 flex flex-wrap gap-6">
                  {["Capitol Hill", "Mar 2026", "4.5 Rating", "Cozy", "WiFi"].map(
                    (item) => (
                      <span
                        key={item}
                        className="font-mono text-xs uppercase tracking-[0.15em] text-espresso-muted"
                      >
                        {item}
                      </span>
                    )
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <InkDivider className="text-espresso" />

        {/* ─── COLORS ─── */}
        <section className="px-6 py-20">
          <div className="mx-auto max-w-5xl">
            <motion.div {...fade}>
              <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-espresso-muted">
                03 &mdash; Color
              </span>
              <h2 className="mt-3 font-heading text-4xl text-espresso">
                Warm, grounded, a pop of ink
              </h2>
            </motion.div>

            <motion.div
              {...fade}
              className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4"
            >
              {[
                { name: "Cream", hex: "#FFF8F0", dark: false },
                { name: "Stone", hex: "#F0EBE3", dark: false },
                { name: "Espresso", hex: "#2C2420", dark: true },
                { name: "Espresso Muted", hex: "#7A6E66", dark: true },
                { name: "Terracotta", hex: "#C4735B", dark: true },
                { name: "Sage", hex: "#8BAA8F", dark: false },
                { name: "Ink Blue", hex: "#3D5A80", dark: true },
                { name: "Pink", hex: "#E8B4B8", dark: false },
              ].map((color) => (
                <div key={color.name} className="overflow-hidden rounded-xl">
                  <div
                    className="flex h-24 items-end p-3"
                    style={{ backgroundColor: color.hex }}
                  >
                    <span
                      className="font-mono text-[10px] uppercase tracking-wider"
                      style={{ color: color.dark ? "#FFF8F0" : "#2C2420" }}
                    >
                      {color.hex}
                    </span>
                  </div>
                  <div className="bg-stone px-3 py-2">
                    <span className="text-sm font-medium text-espresso">
                      {color.name}
                    </span>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        <InkDivider className="text-espresso" />

        {/* ─── COMPONENTS ─── */}
        <section className="px-6 py-20">
          <div className="mx-auto max-w-5xl">
            <motion.div {...fade}>
              <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-espresso-muted">
                04 &mdash; Components
              </span>
            </motion.div>

            {/* Buttons */}
            <motion.div {...fade} className="mt-10">
              <h3 className="font-heading text-2xl text-espresso">Buttons</h3>
              <div className="mt-6 flex flex-wrap items-center gap-4">
                <button className="rounded-lg bg-terracotta px-6 py-2.5 text-sm font-medium text-cream transition-all hover:bg-terracotta-dark">
                  Explore the Map
                </button>
                <button className="rounded-lg border border-espresso/20 px-6 py-2.5 text-sm font-medium text-espresso transition-all hover:bg-espresso/[0.03]">
                  Browse Cafes
                </button>
                <button className="text-sm font-medium text-terracotta transition-all hover:opacity-70">
                  see all reviews &rarr;
                </button>
              </div>
            </motion.div>

            {/* Tags */}
            <motion.div {...fade} className="mt-12">
              <h3 className="font-heading text-2xl text-espresso">
                Tags &amp; Badges
              </h3>
              <div className="mt-6 flex flex-wrap gap-2">
                {["cozy", "good wifi", "matcha", "outdoor seating", "bar"].map(
                  (tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-espresso/10 px-3 py-1 font-mono text-[11px] uppercase tracking-wider text-espresso-muted"
                    >
                      {tag}
                    </span>
                  )
                )}
                <span className="rounded-full border border-terracotta bg-terracotta/[0.06] px-3 py-1 font-mono text-[11px] uppercase tracking-wider text-terracotta">
                  active tag
                </span>
              </div>
            </motion.div>

            {/* Ratings */}
            <motion.div {...fade} className="mt-12">
              <h3 className="font-heading text-2xl text-espresso">Ratings</h3>
              <p className="mt-1 text-sm text-espresso-muted">
                more sips = fuller cup = loved it
              </p>
              <div className="mt-6 flex flex-wrap items-end gap-8">
                {[1, 2, 3, 4, 5].map((sips) => (
                  <div key={sips} className="flex flex-col items-center gap-2">
                    <SipsCup sips={sips} size={56} />
                    <span className="font-heading text-lg text-espresso">
                      {sips} {sips === 1 ? "sip" : "sips"}
                    </span>
                    <SipsLabel sips={sips} className="text-xs" />
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        <InkDivider className="text-espresso" />

        {/* ─── CAFE CARDS ─── */}
        <section className="px-6 py-20 bg-stone">
          <div className="mx-auto max-w-5xl">
            <motion.div {...fade}>
              <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-espresso-muted">
                05 &mdash; Cafe Cards
              </span>
            </motion.div>

            <motion.div {...fade} className="mt-10 grid gap-6 md:grid-cols-3">
              {[
                {
                  name: "Elm Coffee Roasters",
                  hood: "Pioneer Square",
                  type: "cafe",
                  sips: 5,
                  tags: ["cozy", "specialty"],
                  illustration: "coffee" as const,
                },
                {
                  name: "Percy's & Co.",
                  hood: "Ballard",
                  type: "bar",
                  sips: 4,
                  tags: ["cocktails", "date night"],
                  illustration: "tea" as const,
                },
                {
                  name: "Matcha Magic",
                  hood: "Capitol Hill",
                  type: "cafe",
                  sips: 5,
                  tags: ["matcha", "modern"],
                  illustration: "matcha" as const,
                },
              ].map((cafe) => (
                <div
                  key={cafe.name}
                  className="group cursor-pointer overflow-hidden rounded-xl border border-espresso/[0.06] bg-cream transition-all duration-200 hover:-translate-y-0.5 hover:border-terracotta/30 hover:shadow-[0_8px_24px_rgba(44,36,32,0.08)]"
                >
                  {/* Illustration placeholder */}
                  <div className="flex aspect-[4/3] items-center justify-center bg-gradient-to-br from-stone to-cream">
                    <Illustration
                      slot={cafe.illustration}
                      className="h-20 w-auto opacity-25 transition-opacity group-hover:opacity-40"
                    />
                  </div>

                  <div className="p-4">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-espresso-muted">
                        {cafe.hood}
                      </span>
                      <span className="text-espresso/15">/</span>
                      <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-espresso-muted">
                        {cafe.type}
                      </span>
                    </div>

                    <h3 className="mt-1.5 font-heading text-xl leading-snug text-espresso transition-colors group-hover:text-terracotta">
                      {cafe.name}
                    </h3>

                    <div className="mt-2">
                      <SipsRating sips={cafe.sips} size={22} />
                    </div>

                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {cafe.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-espresso/[0.04] px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-espresso-muted"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        <InkDivider className="text-espresso" />

        {/* ─── SAMPLE HOMEPAGE HERO ─── */}
        <section className="px-6 py-24">
          <div className="mx-auto max-w-5xl">
            <motion.div {...fade}>
              <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-espresso-muted">
                06 &mdash; Sample: Homepage Hero
              </span>
            </motion.div>

            <motion.div
              {...fade}
              className="mt-12 flex flex-col items-center gap-8 text-center"
            >
              <Illustration slot="about" alt="Two chairs and two cups" className="h-auto w-[180px]" />

              <div>
                <h1 className="font-heading text-7xl text-espresso md:text-8xl">
                  Sips
                </h1>
                <p className="mt-2 font-heading text-3xl text-terracotta">
                  a seattle cafe journal
                </p>
              </div>

              <p className="max-w-md text-base leading-relaxed text-espresso-muted">
                Two coffee &amp; matcha lovers exploring Seattle&apos;s cafe
                scene, one cup at a time. Honest ratings, hand-drawn reviews,
                and a whole lot of lattes.
              </p>

              <div className="flex gap-4">
                <button className="rounded-lg bg-terracotta px-6 py-2.5 text-sm font-medium text-cream transition-all hover:bg-terracotta-dark">
                  Explore the Map
                </button>
                <button className="rounded-lg border border-espresso/20 px-6 py-2.5 text-sm font-medium text-espresso transition-all hover:bg-espresso/[0.03]">
                  Browse Cafes
                </button>
              </div>
            </motion.div>
          </div>
        </section>

        <InkDivider className="text-espresso" />

        {/* ─── SAMPLE: EMPTY STATE ─── */}
        <section className="px-6 py-20 bg-stone">
          <div className="mx-auto max-w-5xl">
            <motion.div {...fade}>
              <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-espresso-muted">
                07 &mdash; Sample: Empty State
              </span>
            </motion.div>

            <motion.div
              {...fade}
              className="mt-12 flex flex-col items-center gap-6 rounded-2xl border border-espresso/[0.06] bg-cream py-16 text-center"
            >
              <Illustration slot="empty" className="h-auto w-[120px]" />
              <div>
                <h3 className="font-heading text-2xl text-espresso">
                  No cafes found
                </h3>
                <p className="mt-2 font-heading text-lg text-espresso-muted">
                  try adjusting your filters
                </p>
              </div>
              <button className="rounded-lg border border-espresso/20 px-5 py-2 text-sm font-medium text-espresso transition-all hover:bg-espresso/[0.03]">
                Clear filters
              </button>
            </motion.div>
          </div>
        </section>

        <InkDivider className="text-espresso" />

        {/* ─── SAMPLE: REVIEW LIST ─── */}
        <section className="px-6 py-20">
          <div className="mx-auto max-w-5xl">
            <motion.div {...fade}>
              <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-espresso-muted">
                08 &mdash; Sample: Review List
              </span>
            </motion.div>

            <motion.div {...fade} className="mt-10 space-y-0">
              {[
                { name: "Oat Milk Latte", place: "Elm Coffee", sips: 5 },
                { name: "Cortado", place: "Espresso Vivace", sips: 4 },
                { name: "Matcha with Oat", place: "Matcha Magic", sips: 5 },
                { name: "Drip Coffee", place: "Black Arrows", sips: 3 },
              ].map((item) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between border-b border-espresso/[0.06] py-4"
                >
                  <div>
                    <span className="text-base text-espresso">{item.name}</span>
                    <span className="ml-3 font-mono text-[10px] uppercase tracking-[0.12em] text-espresso-muted">
                      {item.place}
                    </span>
                  </div>
                  <SipsRating sips={item.sips} size={22} />
                </div>
              ))}
            </motion.div>
          </div>
        </section>
      </main>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-espresso/[0.06] px-6 py-12">
        <div className="mx-auto flex max-w-6xl items-start justify-between">
          <div className="flex items-center gap-3">
            <Illustration slot="logo" className="h-8 w-auto" />
            <div>
              <span className="font-heading text-xl text-espresso">Sips</span>
              <p className="font-heading text-sm text-espresso-muted">
                a seattle cafe journal
              </p>
            </div>
          </div>
          <div className="flex gap-12">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-espresso-muted">
                Explore
              </span>
              <div className="mt-3 flex flex-col gap-2">
                {["Map", "Cafes", "Blog"].map((item) => (
                  <span
                    key={item}
                    className="cursor-pointer text-sm text-espresso transition-colors hover:text-terracotta"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-espresso-muted">
                About
              </span>
              <div className="mt-3 flex flex-col gap-2">
                {["About Us", "Wish List"].map((item) => (
                  <span
                    key={item}
                    className="cursor-pointer text-sm text-espresso transition-colors hover:text-terracotta"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
