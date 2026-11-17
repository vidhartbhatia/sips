import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import WishList from "@/components/want-to-go/WishList";
import { getWantToGo } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";
export const metadata = { title: "Wish List" };

export default async function WantToGoPage() {
  const items = await getWantToGo();

  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <Header />
      <main className="mx-auto max-w-3xl flex-1 px-6 py-12">
        <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-espresso-muted">
          On our radar
        </span>
        <h1 className="mt-2 font-heading text-5xl text-espresso">
          The Wish List
        </h1>
        <p className="mt-3 text-base text-espresso-muted">
          spots we haven&apos;t sipped yet
        </p>
        <WishList items={items} />
      </main>
      <Footer />
    </div>
  );
}
