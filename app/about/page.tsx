// design-rules: enforced
import type { Metadata } from "next";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import InkDivider from "@/components/ui/InkDivider";
import { Illustration } from "@/components/ui/Illustration";

export const metadata: Metadata = { title: "About" };

// The scale as it reads on every review. Keep in step with the scoring rules in lib/ratings.ts.
const SCALE = [
  { score: 5, meaning: "go out of your way" },
  { score: 4, meaning: "we'd return" },
  { score: 3, meaning: "fine" },
  { score: 2, meaning: "skip" },
  { score: 1, meaning: "no" },
] as const;

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-espresso-muted">Who we are</p>
        <h1 className="mt-2 font-heading text-6xl text-espresso">About Sips</h1>

        {/* Draft intro for L. to edit: under 80 words, nothing invented about them. */}
        <div className="mt-8 grid items-center gap-8 sm:grid-cols-[minmax(0,1fr)_14rem]">
          <div className="space-y-5 text-lg leading-relaxed text-espresso">
            <p>
              Sips is a Seattle cafe journal written by Lea and Vids. We visit cafes, order coffee and
              matcha, and write down what we tried and whether we&apos;d go back.
            </p>
            <p>Each review is a visit, in our own words and photos. When we return, the review grows.</p>
          </div>
          <Illustration
            slot="about"
            alt="Two bistro chairs at a small cafe table set with two cups"
            className="mx-auto h-auto w-48 sm:w-full"
          />
        </div>

        {/* The page's one divider, capped so the sprig never repeats across the screen. */}
        <div className="mx-auto my-12 max-w-sm">
          <InkDivider className="text-espresso" />
        </div>

        <section aria-labelledby="how-we-score">
          <h2 id="how-we-score" className="font-heading text-4xl text-espresso">
            How we score
          </h2>
          <dl className="mt-6 space-y-3">
            {SCALE.map(({ score, meaning }) => (
              <div key={score} className="flex items-baseline gap-4">
                <dt className="w-6 shrink-0 font-mono text-xl font-medium text-espresso">{score}</dt>
                <dd className="font-display text-2xl italic text-espresso">{meaning}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-8 leading-relaxed text-espresso-muted">
            Each drink and each visit gets a whole number. A cafe&apos;s score is the average of our visits,
            rounded to the nearest half.
          </p>
        </section>
      </main>
      <Footer />
    </div>
  );
}
