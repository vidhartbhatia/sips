// design-rules: enforced
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import InkDivider from "@/components/ui/InkDivider";
import { Illustration } from "@/components/ui/Illustration";
import { fixturesEnabled } from "@/lib/fixtures";
import {
  DOODLES,
  ILLUSTRATIONS,
  ORNAMENTS,
  type DoodleSlot,
  type IllustrationSlot,
  type OrnamentSlot,
} from "@/lib/illustrations";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { robots: { index: false, follow: false } };

type Slot = IllustrationSlot | DoodleSlot | OrnamentSlot;

const SLOTS: Slot[] = [
  ...(Object.keys(ILLUSTRATIONS) as IllustrationSlot[]).filter((s) => s !== "hero"),
  ...(Object.keys(DOODLES) as DoodleSlot[]),
  ...(Object.keys(ORNAMENTS) as OrnamentSlot[]),
];

/** Every illustration slot on cream at 64px and 240px, for the owner's check (K1). */
export default function IllustrationsFixture() {
  if (!fixturesEnabled()) notFound();

  return (
    <main className="bg-cream px-4 py-10 text-espresso sm:px-8">
      <section aria-labelledby="hero-heading" className="relative">
        <h1 id="hero-heading" className="font-display text-4xl sm:text-6xl">
          Seattle cafes, one cup at a time
        </h1>
        <Illustration slot="hero" priority className="mt-6 h-auto w-full" />
      </section>

      <InkDivider className="my-10" />

      <ul className="grid gap-8 sm:grid-cols-2" data-testid="slots">
        {SLOTS.map((slot) => (
          <li key={slot} className="flex items-end gap-6" data-slot={slot}>
            <Illustration slot={slot} className="h-auto w-[240px]" />
            <Illustration slot={slot} className="h-auto w-16" />
            <span className="font-mono text-xs text-espresso-muted">{slot}</span>
          </li>
        ))}
      </ul>
    </main>
  );
}
