import { describe, expect, it } from "vitest";
import robots from "@/app/robots";
import { cases, FIXTURE_GEO, loadFixture } from "@/app/fixtures/review/cases";
import { buildReviewPage } from "@/lib/review-view";
import {
  buildSitemap,
  cafeJsonLd,
  cafeMetadata,
  FEED_PATH,
  pageMetadata,
  serializeJsonLd,
  siteJsonLd,
  siteMetadata,
} from "@/lib/seo";

type Node = Record<string, unknown>;
const graph = (data: Node) => data["@graph"] as Node[];
const ofType = (data: Node, type: string) => graph(data).filter((n) => n["@type"] === type);

const view = (name: string) => {
  const fixture = loadFixture(name);
  if (!fixture) throw new Error(`no fixture ${name}`);
  return fixture.view;
};

describe("pageMetadata", () => {
  const meta = pageMetadata({ title: "About", description: "Who we are.", path: "/about" });

  it("sets the canonical URL and og:url to the page's own path", () => {
    expect(meta.alternates?.canonical).toBe("/about");
    expect(meta.openGraph?.url).toBe("/about");
  });

  it("keeps the RSS link, site name and large card that a shallow merge would drop", () => {
    expect(meta.alternates?.types).toEqual(siteMetadata.alternates?.types);
    expect(JSON.stringify(meta.alternates?.types)).toContain(FEED_PATH);
    expect(meta.openGraph).toMatchObject({ siteName: "Sips", locale: "en_US", title: "About | Sips" });
    expect(meta.twitter).toMatchObject({ card: "summary_large_image", title: "About | Sips" });
  });

  it("leaves the title to the layout default on the home page", () => {
    const home = pageMetadata({ path: "/" });
    expect(home.title).toBeUndefined();
    expect(home.openGraph?.title).toBe(siteMetadata.openGraph?.title);
  });

  it("puts no canonical in the root layout, which every page would inherit", () => {
    expect(siteMetadata.alternates?.canonical).toBeUndefined();
    expect(siteMetadata.openGraph && "url" in siteMetadata.openGraph).toBe(false);
  });
});

describe("cafeMetadata", () => {
  it("uses the cafe name as the title and the lead verdict as the description", () => {
    const meta = cafeMetadata(view("single"));
    expect(meta.title).toBe("Larkspur Coffee");
    expect(meta.description).toBe("A bright little room with a cortado worth crossing town for.");
    expect(meta.alternates?.canonical).toBe("/cafes/fixture-cafe");
    expect(meta.openGraph).toMatchObject({ type: "article", authors: ["Lea"], publishedTime: "2026-11-01" });
  });

  it("falls back to a plain description when the lead visit has no verdict", () => {
    expect(cafeMetadata(view("bare")).description).toBe("Our review of Larkspur Coffee in Capitol Hill, Seattle.");
  });
});

describe("buildSitemap", () => {
  const urls = (map: ReturnType<typeof buildSitemap>) => map.map((e) => e.url);

  it("lists the public pages plus exactly the cafes and stories it is given", () => {
    const map = buildSitemap({
      cafes: [{ slug: "larkspur", updated_at: "2026-11-10T00:00:00Z" }],
      stories: [{ slug: "first-sip", date: "2026-11-12" }],
    });
    expect(urls(map)).toEqual([
      "https://oursips.com/",
      "https://oursips.com/cafes",
      "https://oursips.com/about",
      "https://oursips.com/stories",
      "https://oursips.com/cafes/larkspur",
      "https://oursips.com/stories/first-sip",
    ]);
    expect(map.find((e) => e.url.endsWith("/cafes/larkspur"))?.lastModified).toBe("2026-11-10T00:00:00Z");
  });

  it("leaves out /stories while there are no published stories", () => {
    expect(urls(buildSitemap({ cafes: [], stories: [] }))).not.toContain("https://oursips.com/stories");
  });
});

describe("robots", () => {
  it("disallows the admin, sign-in and fixture routes and points at the sitemap", () => {
    const r = robots();
    const rules = Array.isArray(r.rules) ? r.rules[0] : r.rules;
    expect(rules.disallow).toEqual(expect.arrayContaining(["/admin", "/login", "/fixtures"]));
    expect(rules.allow).toBe("/");
    expect(r.sitemap).toBe("https://oursips.com/sitemap.xml");
  });
});

describe("cafeJsonLd", () => {
  it("has one Review per published visit, each reviewing the cafe as a CafeOrCoffeeShop", () => {
    const data = cafeJsonLd(view("multi"), FIXTURE_GEO);
    expect(data["@context"]).toBe("https://schema.org");
    const reviews = ofType(data, "Review");
    expect(reviews).toHaveLength(3);
    for (const review of reviews) {
      expect(review.itemReviewed).toEqual({
        "@type": "CafeOrCoffeeShop",
        name: "Larkspur Coffee",
        url: "https://oursips.com/cafes/fixture-cafe",
        address: "1200 E Pike St, Seattle, WA 98122",
        geo: { "@type": "GeoCoordinates", latitude: 47.6145, longitude: -122.3205 },
      });
      expect(review.author).toMatchObject({ "@type": "Person" });
      expect(review.datePublished).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      const rating = review.reviewRating as Node;
      expect(rating).toMatchObject({ "@type": "Rating", bestRating: 5, worstRating: 1 });
      expect(rating.ratingValue).toBeGreaterThanOrEqual(1);
      expect(rating.ratingValue).toBeLessThanOrEqual(5);
    }
    expect(reviews.map((r) => (r.reviewRating as Node).ratingValue).sort()).toEqual([4, 4, 5]);
  });

  it("includes the site's WebSite and Organization", () => {
    const data = cafeJsonLd(view("single"), null);
    expect(ofType(data, "WebSite")).toHaveLength(1);
    expect(ofType(data, "Organization")).toHaveLength(1);
  });

  it("leaves out a draft (the admin preview leads with one)", () => {
    const reviews = ofType(cafeJsonLd(view("draft"), null), "Review");
    expect(reviews.map((r) => r.name)).toEqual(["Still our favourite morning spot."]);
  });

  it("omits geo when the cafe has none, and credits Sips when a visit has no author", () => {
    const [review] = ofType(cafeJsonLd(view("bare"), null), "Review");
    expect(review.itemReviewed).not.toHaveProperty("geo");
    expect(review.author).toEqual({ "@type": "Organization", name: "Sips", url: "https://oursips.com" });
  });

  it("omits the rating of an unscored visit rather than inventing one", () => {
    const input = structuredClone(cases.bare);
    input.reviews[0].overall_rating = null;
    const built = buildReviewPage(input);
    if (!built) throw new Error("no view");
    expect(ofType(cafeJsonLd(built, null), "Review")[0]).not.toHaveProperty("reviewRating");
  });
});

describe("serializeJsonLd", () => {
  it("escapes < so a verdict can't close the script tag, and still parses back", () => {
    const data = { "@type": "Review", name: "</script><script>alert(1)</script>" };
    const text = serializeJsonLd(data);
    expect(text).not.toContain("<");
    expect(JSON.parse(text)).toEqual(data);
  });

  it("round-trips the site graph", () => {
    expect(JSON.parse(serializeJsonLd(siteJsonLd()))).toEqual(siteJsonLd());
  });
});

describe("share images in metadata", () => {
  const images = (m: ReturnType<typeof pageMetadata>) => ({
    og: (m.openGraph as { images?: { url: string }[] } | undefined)?.images,
    twitter: (m.twitter as { images?: { url: string }[] } | undefined)?.images,
  });

  it("names the site card on pages without their own image route", () => {
    const { og, twitter } = images(pageMetadata({ title: "About", path: "/about" }));
    expect(og?.[0]?.url).toBe("/opengraph-image");
    expect(twitter?.[0]?.url).toBe("/opengraph-image");
  });

  it("leaves a cafe page's images to its own opengraph-image route", () => {
    const { og, twitter } = images(cafeMetadata(view("single")));
    expect(og).toBeUndefined();
    expect(twitter).toBeUndefined();
  });
});
