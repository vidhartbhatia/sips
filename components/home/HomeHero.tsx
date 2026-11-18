// design-rules: enforced
import Link from "next/link";
import { getImageProps } from "next/image";
import { HERO_MOBILE, ILLUSTRATIONS } from "@/lib/illustrations";

// The layout switches at Tailwind's `md` (48rem), so the art does too.
const DESKTOP_MEDIA = "(min-width: 48rem)";

/**
 * The watercolour hero, art-directed: from `md` up the wide `hero` art sits right of the
 * headline, cropped to its painted area (its left third is empty room); below `md` the
 * `HERO_MOBILE` crop sits under the text, full width. Its feathered edges fade into the cream
 * page, so there's no frame, border, shadow or background.
 *
 * `fetchPriority="high"` instead of `preload`: preloading would fetch both sources.
 */
function HeroArt() {
  const hero = ILLUSTRATIONS.hero;
  const common = { alt: "" };

  const {
    props: { srcSet: desktop, sizes: desktopSizes },
  } = getImageProps({
    ...common,
    src: hero.src,
    width: hero.width,
    height: hero.height,
    // Painted in a square box (max ~620px) with the left third cropped away, so the
    // whole image renders at about 1.5× the box width.
    sizes: "(min-width: 72rem) 930px, 85vw",
  });
  const {
    props: { srcSet: mobile, ...rest },
  } = getImageProps({
    ...common,
    src: HERO_MOBILE.src,
    width: HERO_MOBILE.width,
    height: HERO_MOBILE.height,
    sizes: "100vw",
    fetchPriority: "high",
    loading: "eager",
  });

  return (
    <picture>
      <source
        media={DESKTOP_MEDIA}
        srcSet={desktop}
        sizes={desktopSizes}
        width={hero.width}
        height={hero.height}
      />
      <img
        {...rest}
        alt=""
        srcSet={mobile}
        className="h-auto w-full md:aspect-square md:object-cover md:object-right"
      />
    </picture>
  );
}

export function HomeHero() {
  return (
    <section className="px-6 pt-12 pb-8 md:pt-16 md:pb-12">
      <div className="mx-auto grid max-w-6xl items-center gap-8 md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] md:gap-6">
        <div className="max-w-md">
          <h1 className="font-heading text-7xl leading-none text-espresso md:text-8xl">Sips</h1>
          <p className="mt-3 font-display text-3xl italic text-espresso">a seattle cafe journal</p>
          <p className="mt-6 text-lg leading-relaxed text-espresso-muted">
            Honest notes on coffee and matcha around Seattle, by Lea and Vids.
          </p>
          <Link
            href="/cafes"
            className="mt-8 inline-block rounded-xl bg-terracotta-dark px-7 py-3 text-base font-medium text-cream transition-colors hover:bg-espresso focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-terracotta-dark"
          >
            Browse cafes
          </Link>
        </div>
        <div data-hero-art>
          <HeroArt />
        </div>
      </div>
    </section>
  );
}
