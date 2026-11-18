// design-rules: enforced
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import InkDivider from "@/components/ui/InkDivider";
import { Illustration } from "@/components/ui/Illustration";
import { CafeCard, type CardCafe } from "@/components/cafes/CafeCard";
import { HomeHero } from "@/components/home/HomeHero";
import { homeLayout, type VisitSummary } from "@/lib/listing";

interface HomeViewProps {
  /** Already ordered (latest visit first) and capped by the caller. */
  cafes: CardCafe[];
  summaries: Record<string, VisitSummary>;
}

/** The home page. Server-rendered and visible from the first byte: no entrance animation. */
export function HomeView({ cafes, summaries }: HomeViewProps) {
  const layout = homeLayout(cafes.length);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        <HomeHero />

        <section className="px-6 pt-8 pb-16" aria-labelledby="recent-sips">
          <div className="mx-auto max-w-6xl">
            {layout === "empty" ? (
              <div className="py-8 text-center">
                <Illustration slot="empty" className="mx-auto h-auto w-28" />
                <h2 id="recent-sips" className="mt-6 font-heading text-4xl text-espresso">
                  First reviews soon.
                </h2>
              </div>
            ) : (
              <>
                <h2 id="recent-sips" className="font-heading text-5xl text-espresso">
                  Recent sips
                </h2>

                {layout === "featured" ? (
                  <ul className="mt-8 space-y-14">
                    {cafes.map((cafe) => (
                      <li key={cafe.id}>
                        <CafeCard cafe={cafe} summary={summaries[cafe.id]} variant="featured" />
                      </li>
                    ))}
                  </ul>
                ) : (
                  <>
                    <ul className="mt-8 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
                      {cafes.map((cafe) => (
                        <li key={cafe.id}>
                          <CafeCard cafe={cafe} summary={summaries[cafe.id]} variant="grid" />
                        </li>
                      ))}
                    </ul>
                    <p className="mt-12">
                      <Link
                        href="/cafes"
                        className="font-medium text-terracotta-dark underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-terracotta-dark"
                      >
                        See all cafes &rarr;
                      </Link>
                    </p>
                  </>
                )}
              </>
            )}
          </div>
        </section>

        <div className="mx-auto max-w-6xl px-6">
          <InkDivider className="text-espresso" />
        </div>

        <section className="px-6 py-16 text-center">
          <p className="font-display text-2xl italic">
            <Link
              href="/about"
              className="text-terracotta-dark underline-offset-4 hover:text-espresso hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-terracotta-dark"
            >
              Who we are, and how we score &rarr;
            </Link>
          </p>
        </section>
      </main>

      <Footer />
    </div>
  );
}
