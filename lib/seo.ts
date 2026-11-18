// Search and share metadata: page <head> tags, the sitemap and JSON-LD. Plain module (no
// React, no server-only imports), so it is unit-tested directly and shared by the real pages
// and the env-gated fixtures.

import type { Metadata, MetadataRoute } from "next";
import { ILLUSTRATIONS } from "@/lib/illustrations";
import type { ReviewPageView, VisitView } from "@/lib/review-view";

export const SITE_URL = "https://oursips.com";
export const SITE_NAME = "Sips";
export const SITE_TITLE = "Sips — A Seattle Cafe Journal";
export const SITE_DESCRIPTION = "A Seattle cafe journal: coffee and matcha, by Lea and Vids.";
export const FEED_PATH = "/stories/feed.xml";

/**
 * The site's default share card (app/opengraph-image.tsx). Pages that set their own
 * `openGraph` lose the inherited image, so `pageMetadata` names it again.
 */
const SITE_IMAGE = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  type: "image/png",
  alt: "Sips, a Seattle cafe journal: a watercolour cafe scene",
};

/** The RSS `<link rel="alternate">`. Every page re-sends it: `alternates` merges shallowly. */
const FEED_LINK = { "application/rss+xml": [{ url: FEED_PATH, title: "Sips stories" }] };

/** Site-wide defaults for the root layout. No canonical or og:url here: every page would inherit them. */
export const siteMetadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_TITLE, template: `%s | ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  keywords: ["seattle", "cafes", "coffee", "matcha", "cafe reviews", "cafe journal"],
  alternates: { types: FEED_LINK },
  openGraph: { title: SITE_TITLE, description: SITE_DESCRIPTION, siteName: SITE_NAME, locale: "en_US", type: "website" },
  twitter: { card: "summary_large_image", title: SITE_TITLE, description: SITE_DESCRIPTION },
};

interface PageMetadataInput {
  /** Page title; the layout template adds " | Sips". Omit on the home page. */
  title?: string;
  description?: string;
  /** Path from the site root, e.g. `/cafes/larkspur`. Becomes the canonical URL and og:url. */
  path: string;
  article?: { publishedTime?: string; authors?: string[] };
  /**
   * The page has its own `opengraph-image.tsx` (cafes, stories). Next fills og:image and
   * twitter:image from it, so the site card must not be named here.
   */
  ownImage?: boolean;
}

/**
 * A public page's metadata: canonical URL, and Open Graph and Twitter tags that keep the site
 * defaults. Next merges `openGraph`, `twitter` and `alternates` shallowly (a page's object
 * replaces the layout's), so this re-sends everything a page would otherwise lose.
 */
export function pageMetadata({
  title,
  description = SITE_DESCRIPTION,
  path,
  article,
  ownImage = false,
}: PageMetadataInput): Metadata {
  const shareTitle = title ? `${title} | ${SITE_NAME}` : SITE_TITLE;
  const images = ownImage ? {} : { images: [SITE_IMAGE] };
  return {
    ...(title && { title }),
    description,
    alternates: { canonical: path, types: FEED_LINK },
    openGraph: {
      title: shareTitle,
      description,
      url: path,
      siteName: SITE_NAME,
      locale: "en_US",
      ...(article ? { type: "article", ...article } : { type: "website" }),
      ...images,
    },
    twitter: { card: "summary_large_image", title: shareTitle, description, ...images },
  };
}

/** A cafe review page's metadata: the cafe name, and the lead verdict as the description. */
export function cafeMetadata(view: ReviewPageView): Metadata {
  const { cafe, lead } = view;
  return pageMetadata({
    title: cafe.name,
    description: lead.verdict ?? `Our review of ${cafe.name} in ${cafe.neighborhood}, Seattle.`,
    path: `/cafes/${cafe.slug}`,
    // No publishedTime: reviews store the visit date, not when the review went live.
    article: lead.author ? { authors: [lead.author] } : {},
    ownImage: true,
  });
}

/** Paths crawlers skip. They are also noindex or sign-in only; this keeps crawlers off them. */
export const DISALLOWED = [
  "/admin",
  "/login",
  "/auth",
  "/fixtures",
  "/want-to-go",
  "/design-system",
  "/design-preview",
];

/** Never index, never follow. For the admin, sign-in and fixture routes. */
export const NOINDEX: Metadata["robots"] = { index: false, follow: false };

export function absoluteUrl(path: string): string {
  return new URL(path, SITE_URL).toString();
}

/**
 * The sitemap: the public static pages, listed cafes and published stories. Callers pass only
 * what anon may see (`listed_cafes`, `listPublishedStories`); this adds nothing else.
 */
export function buildSitemap(input: {
  cafes: ReadonlyArray<{ slug: string; updated_at: string }>;
  stories: ReadonlyArray<{ slug: string; date: string }>;
}): MetadataRoute.Sitemap {
  const pages: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), changeFrequency: "weekly", priority: 1 },
    { url: absoluteUrl("/cafes"), changeFrequency: "weekly", priority: 0.8 },
    { url: absoluteUrl("/about"), changeFrequency: "monthly", priority: 0.5 },
  ];
  if (input.stories.length > 0) {
    pages.push({ url: absoluteUrl("/stories"), changeFrequency: "weekly", priority: 0.6 });
  }
  return [
    ...pages,
    ...input.cafes.map((c) => ({
      url: absoluteUrl(`/cafes/${c.slug}`),
      lastModified: c.updated_at,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...input.stories.map((s) => ({
      url: absoluteUrl(`/stories/${s.slug}`),
      lastModified: s.date,
      changeFrequency: "yearly" as const,
      priority: 0.6,
    })),
  ];
}

// ---------------------------------------------------------------- JSON-LD (schema.org)

type JsonLdNode = Record<string, unknown>;

const ORG_ID = `${SITE_URL}/#organization`;
const WEBSITE_ID = `${SITE_URL}/#website`;

const organization: JsonLdNode = {
  "@type": "Organization",
  "@id": ORG_ID,
  name: SITE_NAME,
  url: SITE_URL,
  logo: absoluteUrl(ILLUSTRATIONS.logo.src),
};

const website: JsonLdNode = {
  "@type": "WebSite",
  "@id": WEBSITE_ID,
  name: SITE_NAME,
  alternateName: "Sips, a Seattle cafe journal",
  url: SITE_URL,
  description: SITE_DESCRIPTION,
  inLanguage: "en-US",
  publisher: { "@id": ORG_ID },
};

/** The site's WebSite and Organization, for the home page. */
export function siteJsonLd(): JsonLdNode {
  return { "@context": "https://schema.org", "@graph": [website, organization] };
}

/**
 * A cafe page's JSON-LD: one `Review` per published visit, each reviewing the cafe as a
 * `CafeOrCoffeeShop`, plus the site's WebSite and Organization. Drafts (the admin preview)
 * are left out. `geo` comes from the cafe row; the page view doesn't carry it.
 */
export function cafeJsonLd(view: ReviewPageView, geo: { lat: number; lng: number } | null): JsonLdNode {
  const url = absoluteUrl(`/cafes/${view.cafe.slug}`);
  const address = view.cafe.address.trim();
  const cafe: JsonLdNode = {
    "@type": "CafeOrCoffeeShop",
    name: view.cafe.name,
    url,
    ...(address && { address }),
    ...(isPlaced(geo, address) && { geo: { "@type": "GeoCoordinates", latitude: geo.lat, longitude: geo.lng } }),
  };
  const reviews = [view.lead, ...view.earlier]
    .filter((v) => v.status === "published")
    .map((v) => reviewNode(v, cafe, url));
  return { "@context": "https://schema.org", "@graph": [...reviews, website, organization] };
}

/**
 * Whether a cafe has real coordinates. A cafe made from the capture form's "New cafe" has no
 * address and lat = lng = 0 (it is only geocoded from an address), and must never be
 * published as sitting at 0,0 in the Gulf of Guinea.
 */
function isPlaced(
  geo: { lat: number; lng: number } | null,
  address: string,
): geo is { lat: number; lng: number } {
  if (!geo || !address) return false;
  if (!Number.isFinite(geo.lat) || !Number.isFinite(geo.lng)) return false;
  return !(geo.lat === 0 && geo.lng === 0);
}

function reviewNode(visit: VisitView, cafe: JsonLdNode, url: string): JsonLdNode {
  const body = visit.paragraphs.join("\n\n");
  return {
    "@type": "Review",
    itemReviewed: cafe,
    url,
    author: visit.author
      ? { "@type": "Person", name: visit.author }
      : { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
    publisher: { "@id": ORG_ID },
    // No datePublished: reviews store the visit date, not when the review went live.
    ...(visit.verdict && { name: visit.verdict }),
    ...(body && { reviewBody: body }),
    ...(visit.score !== null && {
      reviewRating: { "@type": "Rating", ratingValue: visit.score, bestRating: 5, worstRating: 1 },
    }),
  };
}

/**
 * JSON for a `<script type="application/ld+json">`. `<` is escaped so text in a verdict (say
 * `</script>`) can't close the tag early.
 */
export function serializeJsonLd(data: JsonLdNode): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
