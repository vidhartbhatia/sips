import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import CafeGrid from "@/components/cafes/CafeGrid";
import { getCafes } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

export default async function CafesPage() {
  const cafes = await getCafes();

  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <Header />
      <main className="mx-auto max-w-6xl flex-1 px-6 py-12">
        <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-espresso-muted">
          Browse
        </span>
        <h1 className="mt-2 font-heading text-5xl text-espresso">
          All Cafes
        </h1>

        <CafeGrid cafes={cafes} />
      </main>
      <Footer />
    </div>
  );
}
