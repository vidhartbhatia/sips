"use client";

import Header from "@/components/layout/Header";
import { SipsCup, SipsLabel } from "@/components/ui/SipsRating";
import SipsRating from "@/components/ui/SipsRating";

export default function DesignPreview() {
  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <Header />
      <main className="mx-auto max-w-5xl flex-1 px-6 py-12">
        <h1 className="text-center font-heading text-4xl font-bold text-espresso">
          The &quot;Sips&quot; Rating System
        </h1>
        <p className="mt-2 text-center font-heading text-lg text-espresso-muted">
          more sips = fuller cup = loved it
        </p>

        {/* Full progression */}
        <section className="mt-12">
          <h2 className="font-heading text-2xl font-bold text-espresso">
            The Progression
          </h2>
          <p className="mt-1 text-sm text-espresso-muted">
            1 sip = nearly empty, meh. 5 sips = full to the brim, incredible.
          </p>
          <div className="mt-8 flex flex-wrap items-end justify-center gap-10">
            {[1, 2, 3, 4, 5].map((sips) => (
              <div key={sips} className="flex flex-col items-center gap-3">
                <SipsCup sips={sips} size={90} />
                <span className="font-heading text-xl text-espresso">
                  {sips} {sips === 1 ? "sip" : "sips"}
                </span>
                <span className="text-xs text-espresso-muted">
                  {sips === 1 && "meh"}
                  {sips === 2 && "it's okay"}
                  {sips === 3 && "pretty good"}
                  {sips === 4 && "loved it"}
                  {sips === 5 && "incredible"}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* In-context: Cafe cards */}
        <section className="mt-20">
          <h2 className="font-heading text-2xl font-bold text-espresso">
            In Context — Cafe Cards
          </h2>
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            {[
              { name: "Elm Coffee Roasters", hood: "Pioneer Square", sips: 5 },
              { name: "Victrola Coffee", hood: "Capitol Hill", sips: 4 },
              { name: "That One Place", hood: "Ballard", sips: 2 },
            ].map((cafe) => (
              <div key={cafe.name} className="hand-drawn-border bg-cream p-5">
                <div className="aspect-[4/3] rounded bg-gradient-to-br from-sage/20 to-pink/20" />
                <div className="mt-4">
                  <h3 className="font-heading text-lg font-semibold text-espresso">
                    {cafe.name}
                  </h3>
                  <p className="font-heading text-sm text-espresso-muted">{cafe.hood}</p>
                  <div className="mt-3">
                    <SipsRating sips={cafe.sips} size={28} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Compact / inline */}
        <section className="mt-16">
          <h2 className="font-heading text-2xl font-bold text-espresso">
            Compact — Map Popups &amp; Lists
          </h2>
          <div className="mt-6 space-y-3">
            {[5, 4, 3, 2, 1].map((sips) => (
              <div key={sips} className="flex items-center gap-3">
                <SipsCup sips={sips} size={22} />
                <SipsLabel sips={sips} className="text-sm" />
                <span className="text-xs text-espresso-muted">
                  — Elm Coffee Roasters, Pioneer Square
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Individual drink ratings */}
        <section className="mt-16 mb-16">
          <h2 className="font-heading text-2xl font-bold text-espresso">
            Per-Drink Ratings
          </h2>
          <p className="mt-1 text-sm text-espresso-muted">
            each drink gets its own cup rating
          </p>
          <div className="mt-6 space-y-4">
            {[
              { name: "Oat Milk Latte", sips: 5 },
              { name: "Drip Coffee", sips: 3 },
              { name: "Matcha Latte", sips: 4 },
              { name: "Almond Croissant", sips: 5 },
            ].map((item) => (
              <div
                key={item.name}
                className="flex items-center justify-between border-b border-espresso/10 pb-3"
              >
                <span className="text-espresso">{item.name}</span>
                <SipsRating sips={item.sips} size={24} />
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
