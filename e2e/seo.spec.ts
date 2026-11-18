import { expect, test, type APIRequestContext, type Page } from "@playwright/test";
import { trackErrors } from "./helpers";

// Search and share tags, read-only. The cafe checks use the env-gated review fixtures, which
// render through the same metadata, JSON-LD and share-image code as a real cafe page. The
// sitemap reads the live database, so it is checked for structure and absences only; the
// signed-in golden path checks a real cafe joining it on publish.

const meta = (page: Page, key: string) =>
  page.locator(`meta[property="${key}"], meta[name="${key}"]`).first().getAttribute("content");

/** The path (and query) of an absolute oursips.com URL, to fetch from the local server. */
const localPath = (url: string | null) => {
  expect(url, "missing URL").toBeTruthy();
  const u = new URL(url ?? "");
  expect(u.origin).toBe("https://oursips.com");
  return `${u.pathname}${u.search}`;
};

async function expectPng(request: APIRequestContext, path: string) {
  const res = await request.get(path);
  expect(res.status(), `${path} status`).toBe(200);
  expect(res.headers()["content-type"]).toBe("image/png");
  const body = await res.body();
  expect(body.subarray(1, 4).toString()).toBe("PNG");
  expect([body.readUInt32BE(16), body.readUInt32BE(20)]).toEqual([1200, 630]);
}

test.describe("cafe page (fixture)", () => {
  test("title, description, canonical, share image and JSON-LD", async ({ page, request }) => {
    const errors = trackErrors(page);
    await page.goto("/fixtures/review/single");

    await expect(page).toHaveTitle("Larkspur Coffee | Sips");
    const verdict = "A bright little room with a cortado worth crossing town for.";
    expect(await meta(page, "description")).toBe(verdict);
    expect(await meta(page, "og:description")).toBe(verdict);
    expect(await meta(page, "og:title")).toBe("Larkspur Coffee | Sips");
    expect(await meta(page, "twitter:card")).toBe("summary_large_image");
    expect(await page.locator('link[rel="canonical"]').getAttribute("href")).toBe(
      "https://oursips.com/cafes/fixture-cafe",
    );
    expect(await meta(page, "robots")).toBe("noindex, nofollow");

    // The share image is this page's own card, and it renders.
    const ogImage = localPath(await meta(page, "og:image"));
    expect(ogImage).toMatch(/^\/fixtures\/review\/single\/opengraph-image/);
    expect(localPath(await meta(page, "twitter:image"))).toBe(ogImage);
    await expectPng(request, ogImage);

    // JSON-LD parses and describes the visit as a Review of a CafeOrCoffeeShop.
    const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
    expect(blocks).toHaveLength(1);
    const graph = (JSON.parse(blocks[0]) as { "@graph": Record<string, unknown>[] })["@graph"];
    const review = graph.find((n) => n["@type"] === "Review");
    expect(review).toMatchObject({
      itemReviewed: { "@type": "CafeOrCoffeeShop", name: "Larkspur Coffee" },
      reviewRating: { "@type": "Rating", ratingValue: 4, bestRating: 5, worstRating: 1 },
      author: { "@type": "Person", name: "Lea" },
    });
    expect(graph.map((n) => n["@type"])).toEqual(expect.arrayContaining(["WebSite", "Organization"]));

    // The data block sits under the nonce CSP without tripping it.
    expect(errors).toEqual([]);
  });

  test("an unknown case's share image is a 404, not a card", async ({ request }) => {
    expect((await request.get("/fixtures/review/nope/opengraph-image")).status()).toBe(404);
    expect((await request.get("/cafes/no-such-cafe-here/opengraph-image")).status()).toBe(404);
  });
});

test.describe("public pages", () => {
  for (const [path, title] of [
    ["/", "Sips — A Seattle Cafe Journal"],
    ["/about", "About | Sips"],
    ["/cafes", "Cafes | Sips"],
    ["/stories", "Stories | Sips"],
  ] as const) {
    test(`${path} has a canonical URL, the site share card and the RSS link`, async ({ page, request }) => {
      await page.goto(path);
      await expect(page).toHaveTitle(title);
      expect(await page.locator('link[rel="canonical"]').getAttribute("href")).toBe(
        `https://oursips.com${path === "/" ? "" : path}`,
      );
      expect(await meta(page, "og:url")).toBe(`https://oursips.com${path === "/" ? "" : path}`);
      expect(await meta(page, "og:site_name")).toBe("Sips");
      expect(await meta(page, "twitter:card")).toBe("summary_large_image");
      const ogImage = localPath(await meta(page, "og:image"));
      expect(ogImage).toMatch(/^\/opengraph-image/);
      expect(localPath(await meta(page, "twitter:image"))).toMatch(/^\/opengraph-image/);
      expect(await page.locator('link[rel="alternate"][type="application/rss+xml"]').getAttribute("href")).toBe(
        "https://oursips.com/stories/feed.xml",
      );
      expect(await page.locator('meta[name="robots"]').count()).toBe(0);
      await expectPng(request, ogImage);
    });
  }

  test("the home page carries the site's WebSite and Organization", async ({ page }) => {
    await page.goto("/");
    const [block] = await page.locator('script[type="application/ld+json"]').allTextContents();
    const types = (JSON.parse(block) as { "@graph": { "@type": string }[] })["@graph"].map((n) => n["@type"]);
    expect(types).toEqual(["WebSite", "Organization"]);
  });

  test("sign-in is noindex", async ({ page }) => {
    await page.goto("/login");
    expect(await meta(page, "robots")).toBe("noindex, nofollow");
  });
});

test.describe("crawler files", () => {
  test("robots.txt disallows the admin and sign-in and names the sitemap", async ({ request }) => {
    const res = await request.get("/robots.txt");
    expect(res.status()).toBe(200);
    const body = await res.text();
    for (const path of ["/admin", "/login", "/fixtures"]) expect(body).toContain(`Disallow: ${path}\n`);
    expect(body).toContain("Sitemap: https://oursips.com/sitemap.xml");
  });

  test("sitemap.xml lists public pages only, and every cafe in it is live", async ({ request }) => {
    const res = await request.get("/sitemap.xml");
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("xml");
    const locs = [...(await res.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    expect(locs).toEqual(expect.arrayContaining(["https://oursips.com/", "https://oursips.com/about"]));
    expect(locs.filter((u) => /\/(admin|login|fixtures|want-to-go|design-)/.test(u))).toEqual([]);
    // content/blog/hello-sips.mdx is a draft.
    expect(locs).not.toContain("https://oursips.com/stories/hello-sips");

    for (const url of locs.filter((u) => u.includes("/cafes/"))) {
      expect((await request.get(localPath(url))).status(), url).toBe(200);
    }
  });

  test("the stories feed is RSS and leaves out drafts", async ({ request }) => {
    const res = await request.get("/stories/feed.xml");
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toBe("application/rss+xml; charset=utf-8");
    const body = await res.text();
    expect(body).toContain('<rss version="2.0"');
    expect(body).not.toContain("hello-sips");
  });
});
