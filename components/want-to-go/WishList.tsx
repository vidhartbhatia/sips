"use client";

import Image from "next/image";
import { motion } from "framer-motion";

interface WishListItem {
  id: string;
  name: string;
  address: string;
  neighborhood?: string;
  source: string;
  notes: string | null;
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0 },
};

export default function WishList({ items }: { items: WishListItem[] }) {
  if (items.length === 0) {
    return (
      <div className="mt-16 text-center">
        <Image
          src="/illustrations/stacked-cups.svg"
          alt=""
          width={120}
          height={120}
          className="mx-auto mb-6 opacity-40"
        />
        <p className="font-heading text-2xl text-espresso-muted">
          No spots on the list yet
        </p>
        <p className="mt-2 text-sm text-espresso-muted">
          Import from Google Maps or add manually in the admin panel
        </p>
      </div>
    );
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="mt-10 space-y-4"
    >
      {items.map((place) => (
        <motion.div
          key={place.id}
          variants={item}
          className="rounded-xl border border-espresso/[0.12] bg-stone p-5"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <Image
                src="/illustrations/coffee-cup.svg"
                alt=""
                width={24}
                height={24}
                className="mt-0.5 shrink-0 opacity-30"
              />
              <div>
                <h3 className="font-heading text-xl text-espresso">
                  {place.name}
                </h3>
                {place.address && (
                  <p className="text-sm text-espresso-muted">{place.address}</p>
                )}
                {place.notes && (
                  <p className="mt-2 text-sm italic text-espresso-muted">
                    &ldquo;{place.notes}&rdquo;
                  </p>
                )}
              </div>
            </div>
            <span className="shrink-0 rounded-full border border-espresso/[0.1] px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-espresso-muted">
              {place.source === "google_maps"
                ? "Google Maps"
                : "added by us"}
            </span>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}
