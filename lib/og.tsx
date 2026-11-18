import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import sharp from "sharp";
import { formatScore } from "@/lib/format";
import type { ReviewPageView } from "@/lib/review-view";

// Share images (Open Graph and Twitter cards), drawn with `next/og` in the Ink & Paper style.
// The routes are the `opengraph-image.tsx` files; this module holds the cards, fonts and art.
//
// Satori (inside next/og) needs literal colours and static TTF fonts, and it can't decode WebP,
// so the watercolour art goes through sharp first. Photos are fetched here, server-side, from
// the short-lived signed URL; the card embeds the pixels, never the URL.

export const OG_SIZE = { width: 1200, height: 630 } as const;

/** Pinned to the `:root` tokens in app/globals.css (tests/unit/og.test.ts checks they match). */
export const OG_COLORS = {
  cream: "#FFF8F0",
  stone: "#F0EBE3",
  espresso: "#2C2420",
  espressoMuted: "#6E625A",
  terracottaDark: "#9C5641",
} as const;

/** The left panel of the cafe and story cards. */
const PANEL = { width: 540, height: OG_SIZE.height } as const;

// Literal paths, so Next's file tracing bundles these with the image routes.
const asset = {
  caveat: () => readFile(path.join(process.cwd(), "assets/fonts/Caveat-Regular.ttf")),
  serif: () => readFile(path.join(process.cwd(), "assets/fonts/InstrumentSerif-Regular.ttf")),
  serifItalic: () => readFile(path.join(process.cwd(), "assets/fonts/InstrumentSerif-Italic.ttf")),
  mono: () => readFile(path.join(process.cwd(), "assets/fonts/IBMPlexMono-Medium.ttf")),
  sans: () => readFile(path.join(process.cwd(), "assets/fonts/PlusJakartaSans-Medium.ttf")),
  hero: () => readFile(path.join(process.cwd(), "public/illustrations/hero.webp")),
  heroPanel: () => readFile(path.join(process.cwd(), "public/illustrations/hero-mobile.webp")),
  logo: () => readFile(path.join(process.cwd(), "public/illustrations/logo.svg")),
};

type Font = NonNullable<ConstructorParameters<typeof ImageResponse>[1]>["fonts"];

/** Loaded once per server process; a failed load is retried on the next request. */
function once<T>(load: () => Promise<T>): () => Promise<T> {
  let pending: Promise<T> | null = null;
  return () => {
    pending ??= load().catch((error: unknown) => {
      pending = null;
      throw error;
    });
    return pending;
  };
}

const fonts = once(async (): Promise<Font> => {
  const [caveat, serif, serifItalic, mono, sans] = await Promise.all([
    asset.caveat(),
    asset.serif(),
    asset.serifItalic(),
    asset.mono(),
    asset.sans(),
  ]);
  return [
    { name: "Caveat", data: caveat, weight: 400, style: "normal" },
    { name: "Instrument Serif", data: serif, weight: 400, style: "normal" },
    { name: "Instrument Serif", data: serifItalic, weight: 400, style: "italic" },
    { name: "IBM Plex Mono", data: mono, weight: 500, style: "normal" },
    { name: "Plus Jakarta Sans", data: sans, weight: 500, style: "normal" },
  ];
});

const toDataUri = (bytes: Buffer, type: string) => `data:${type};base64,${bytes.toString("base64")}`;

/** Any image sharp reads (WebP, JPEG, PNG, SVG…) → a JPEG data URI on cream, cropped to `size`. */
async function rasterize(bytes: Buffer, size: { width: number; height: number }): Promise<string> {
  const jpeg = await sharp(bytes)
    .rotate() // honour EXIF orientation from phone photos
    .flatten({ background: OG_COLORS.cream }) // the watercolours fade out to transparent
    .resize(size.width, size.height, { fit: "cover" })
    .jpeg({ quality: 85 })
    .toBuffer();
  return toDataUri(jpeg, "image/jpeg");
}

const art = {
  hero: once(async () => rasterize(await asset.hero(), OG_SIZE)),
  panel: once(async () => rasterize(await asset.heroPanel(), PANEL)),
  logo: once(async () => toDataUri(await asset.logo(), "image/svg+xml")),
};

const PHOTO_TIMEOUT_MS = 5_000;
const PHOTO_MAX_BYTES = 15 * 1024 * 1024;

/**
 * A review photo as a JPEG data URI for the card's left panel, or null (the card then shows
 * the watercolour). `url` is a signed URL from lib/storage.ts (or a fixture's data: URI). Never
 * throws: a slow, missing or unreadable photo falls back rather than failing the image.
 */
export async function loadPhoto(url: string | null): Promise<string | null> {
  if (!url) return null;
  try {
    const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(PHOTO_TIMEOUT_MS) });
    if (!res.ok || !res.headers.get("content-type")?.startsWith("image/")) return null;
    const bytes = Buffer.from(await res.arrayBuffer());
    if (bytes.length > PHOTO_MAX_BYTES) return null;
    return await rasterize(bytes, PANEL);
  } catch (error) {
    console.error("og loadPhoto:", error instanceof Error ? error.message : error);
    return null;
  }
}

/** Cut `text` to at most `max` characters at a word boundary, with an ellipsis. */
export function clip(text: string, max: number): string {
  const clean = text.trim().replace(/\s+/g, " ");
  if (clean.length <= max) return clean;
  // One character past the budget, so a word that ends exactly at the limit is kept whole.
  const window = clean.slice(0, max);
  const space = window.lastIndexOf(" ");
  const cut = space > max * 0.6 ? window.slice(0, space) : window.slice(0, max - 1);
  return `${cut.replace(/[\s,.;:–—-]+$/, "")}…`;
}

/** Caveat size for a title: big for short names, smaller as they grow, so two lines at most. */
export function titleSize(text: string): number {
  if (text.length <= 18) return 96;
  if (text.length <= 28) return 80;
  if (text.length <= 40) return 66;
  return 56;
}

/** Short cache for cafe cards: an unpublished review's photo must not live on at the edge. */
export const CAFE_CACHE = "public, max-age=600, s-maxage=3600";
/** Stories and the site card change only with a deploy. */
export const STATIC_CACHE = "public, max-age=3600, s-maxage=86400";

async function render(element: React.ReactElement, cacheControl: string): Promise<ImageResponse> {
  return new ImageResponse(element, {
    ...OG_SIZE,
    fonts: await fonts(),
    headers: { "Cache-Control": cacheControl },
  });
}

const label = {
  fontFamily: "IBM Plex Mono",
  // Large for a label: a feed shows the card at about a quarter of this width.
  fontSize: 23,
  letterSpacing: 3,
  textTransform: "uppercase",
  color: OG_COLORS.espressoMuted,
} as const;

function Masthead({ logo }: { logo: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
      {/* eslint-disable-next-line @next/next/no-img-element -- satori, not the DOM */}
      <img src={logo} width={52} height={48} alt="" />
      <span style={label}>Sips · Seattle</span>
    </div>
  );
}

/** The single-stroke cup beside a score, as on the review page (components/ui/Score.tsx). */
function Cup() {
  return (
    <svg width="44" height="44" viewBox="0 0 32 32" fill="none" stroke={OG_COLORS.espresso} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 12h15v6.5a6 6 0 0 1-6 6h-3a6 6 0 0 1-6-6V12Zm15 2h1.5a3 3 0 0 1 0 6H21.6M5 27.5h19M12.5 4.5c-1 1.5 1 2.5 0 4M16.5 4.5c-1 1.5 1 2.5 0 4" />
    </svg>
  );
}

interface SplitCardProps {
  panel: string;
  logo: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}

/** Picture on the left, cream text column on the right. */
function SplitCard({ panel, logo, children, footer }: SplitCardProps) {
  return (
    <div style={{ display: "flex", width: "100%", height: "100%", background: OG_COLORS.cream }}>
      {/* eslint-disable-next-line @next/next/no-img-element -- satori, not the DOM */}
      <img src={panel} width={PANEL.width} height={PANEL.height} alt="" style={{ objectFit: "cover" }} />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          flex: 1,
          padding: "52px 60px 48px",
        }}
      >
        <Masthead logo={logo} />
        <div style={{ display: "flex", flexDirection: "column" }}>{children}</div>
        {footer}
      </div>
    </div>
  );
}

export interface CafeCard {
  name: string;
  neighborhood: string;
  verdict: string | null;
  score: number | null;
  /** A signed photo URL (or a fixture's data: URI). Null → the watercolour. */
  photoUrl: string | null;
}

/** The card for a review page: the lead visit's hero photo, else the newest earlier one. */
export function cafeCard(view: ReviewPageView): CafeCard {
  const hero = view.lead.hero ?? view.earlier.find((v) => v.hero)?.hero ?? null;
  return {
    name: view.cafe.name,
    neighborhood: view.cafe.neighborhood,
    verdict: view.lead.verdict,
    score: view.score.value,
    photoUrl: hero?.url ?? null,
  };
}

/** A cafe page's share image: hero photo, cafe name, verdict and score. */
export async function cafeImage(card: CafeCard): Promise<ImageResponse> {
  const [photo, panel, logo] = await Promise.all([loadPhoto(card.photoUrl), art.panel(), art.logo()]);
  const footer = (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      {card.score !== null ? (
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <Cup />
          <span style={{ fontFamily: "IBM Plex Mono", fontSize: 56, color: OG_COLORS.espresso }}>
            {formatScore(card.score)}
          </span>
          <span style={{ fontFamily: "IBM Plex Mono", fontSize: 32, color: OG_COLORS.espressoMuted, marginTop: 12 }}>
            /5
          </span>
        </div>
      ) : (
        <div style={{ display: "flex" }} />
      )}
      <span style={{ ...label, letterSpacing: 2 }}>{clip(card.neighborhood, 24)}</span>
    </div>
  );

  return render(
    <SplitCard panel={photo ?? panel} logo={logo} footer={footer}>
      <div
        style={{
          display: "flex",
          fontFamily: "Caveat",
          fontSize: titleSize(card.name),
          lineHeight: 1.02,
          color: OG_COLORS.espresso,
        }}
      >
        {clip(card.name, 56)}
      </div>
      {card.verdict && (
        <div
          style={{
            display: "flex",
            marginTop: 22,
            fontFamily: "Instrument Serif",
            fontStyle: "italic",
            fontSize: 38,
            lineHeight: 1.22,
            color: OG_COLORS.espresso,
          }}
        >
          {clip(card.verdict, 100)}
        </div>
      )}
    </SplitCard>,
    CAFE_CACHE,
  );
}

export interface StoryCard {
  title: string;
  date: string;
  author?: string;
  excerpt?: string;
}

/** A story's share image: title, excerpt, date and author beside the watercolour. */
export async function storyImage(story: StoryCard): Promise<ImageResponse> {
  const [panel, logo] = await Promise.all([art.panel(), art.logo()]);
  const byline = [story.date, story.author].filter(Boolean).join(" · ");
  return render(
    <SplitCard panel={panel} logo={logo} footer={<span style={{ ...label, letterSpacing: 2 }}>{byline}</span>}>
      <span style={{ ...label, color: OG_COLORS.terracottaDark, marginBottom: 12 }}>Story</span>
      <div
        style={{
          display: "flex",
          fontFamily: "Caveat",
          fontSize: titleSize(story.title),
          lineHeight: 1.02,
          color: OG_COLORS.espresso,
        }}
      >
        {clip(story.title, 70)}
      </div>
      {story.excerpt && (
        <div
          style={{
            display: "flex",
            marginTop: 20,
            fontFamily: "Instrument Serif",
            fontSize: 30,
            lineHeight: 1.3,
            color: OG_COLORS.espressoMuted,
          }}
        >
          {clip(story.excerpt, 130)}
        </div>
      )}
    </SplitCard>,
    STATIC_CACHE,
  );
}

/** The site default: the watercolour hero with "Sips, a Seattle cafe journal". */
export async function siteImage(): Promise<ImageResponse> {
  const [hero, logo] = await Promise.all([art.hero(), art.logo()]);
  return render(
    <div style={{ display: "flex", width: "100%", height: "100%", position: "relative", background: OG_COLORS.cream }}>
      {/* eslint-disable-next-line @next/next/no-img-element -- satori, not the DOM */}
      <img src={hero} width={OG_SIZE.width} height={OG_SIZE.height} alt="" style={{ position: "absolute", top: 0, left: 0 }} />
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 72px", width: 560 }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- satori, not the DOM */}
        <img src={logo} width={104} height={97} alt="" />
        <div style={{ display: "flex", marginTop: 12, fontFamily: "Caveat", fontSize: 150, lineHeight: 1, color: OG_COLORS.espresso }}>
          Sips
        </div>
        <div style={{ display: "flex", marginTop: 8, fontFamily: "Instrument Serif", fontStyle: "italic", fontSize: 44, lineHeight: 1.2, color: OG_COLORS.espresso }}>
          a Seattle cafe journal
        </div>
        <span style={{ ...label, marginTop: 36 }}>oursips.com</span>
      </div>
    </div>,
    STATIC_CACHE,
  );
}

/** For an image route asked about something that isn't public (unlisted cafe, draft story). */
export function notFoundImage(): Response {
  return new Response("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });
}
