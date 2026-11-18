// design-rules: enforced
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import CafeGrid from "@/components/cafes/CafeGrid";
import type { CardCafe } from "@/components/cafes/CafeCard";
import type { VisitSummary } from "@/lib/listing";

interface CafesViewProps {
  cafes: CardCafe[];
  summaries: Record<string, VisitSummary>;
}

/** The /cafes page, shared by the route and its fixture so both render the same markup. */
export function CafesView({ cafes, summaries }: CafesViewProps) {
  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-12">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-espresso-muted">Browse</p>
        <h1 className="mt-2 font-heading text-6xl text-espresso">All Cafes</h1>

        <CafeGrid cafes={cafes} summaries={summaries} />
      </main>
      <Footer />
    </div>
  );
}
