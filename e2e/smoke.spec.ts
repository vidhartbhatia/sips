import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { test, expect, type Page } from "@playwright/test";

/**
 * Read-only smoke suite. No logins, no form submissions, no writes.
 * Public pages read the live Supabase project through the anon (publishable) key.
 */

/** Collects console errors and uncaught exceptions. Attach before `goto`. */
function trackErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(`console: ${msg.text()}`);
  });
  page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`));
  return errors;
}

async function expectCleanPage(page: Page, url: string, heading: string | RegExp) {
  const errors = trackErrors(page);
  const response = await page.goto(url);
  expect(response?.status(), `${url} status`).toBe(200);
  await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible();
  expect(errors, `errors on ${url}:\n${errors.join("\n")}`).toEqual([]);
}

test.describe("public pages render", () => {
  const pages: { url: string; heading: string | RegExp }[] = [
    { url: "/", heading: "Sips" },
    { url: "/cafes", heading: "All Cafes" },
    { url: "/stories", heading: "Stories" },
    { url: "/about", heading: "About Sips" },
  ];

  for (const { url, heading } of pages) {
    test(`${url} returns 200 with no console errors`, async ({ page }) => {
      await expectCleanPage(page, url, heading);
    });
  }

  test("a cafe detail page renders", async ({ page }) => {
    const hrefs = await listedCafeHrefs(page);
    test.skip(hrefs.length === 0, "no reviewed cafes yet, so no detail page to test");
    const href = hrefs[0];
    expect(href).toMatch(/^\/cafes\/[a-z0-9-]+$/);

    const errors = trackErrors(page);
    const response = await page.goto(href!);
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    expect(errors, errors.join("\n")).toEqual([]);
  });

  test("/map mounts the map canvas", async ({ page }) => {
    // Checks that the map mounts, not that tiles render. An empty stub style means no
    // tile/font/sprite requests, so no late async Mapbox errors can race the error check.
    // The one real call left is the session check, which validates the (URL-restricted)
    // token. Its status is asserted directly, since the console error it causes can land
    // after the check below.
    await page.route(/^https:\/\/api\.mapbox\.com\/styles\/v1\//, (route) =>
      route.fulfill({ json: { version: 8, sources: {}, layers: [] } }),
    );
    const errors = trackErrors(page);
    const sessionChecked = page.waitForResponse(/api\.mapbox\.com\/map-sessions\//);
    const response = await page.goto("/map");
    expect(response?.status()).toBe(200);
    await expect(page.locator("canvas.mapboxgl-canvas")).toBeVisible();
    const session = await sessionChecked;
    expect(session.status(), "Mapbox rejected the token for localhost:3000").toBe(200);
    expect(errors, errors.join("\n")).toEqual([]);
  });

  test("/login renders the magic-link form", async ({ page }) => {
    const errors = trackErrors(page);
    const response = await page.goto("/login");
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("textbox")).toHaveAttribute("type", "email");
    await expect(page.getByRole("button", { name: "Send magic link" })).toBeEnabled();
    expect(errors, errors.join("\n")).toEqual([]);
  });
});

test.describe("launch gating", () => {
  test("cafes index shows only reviewed cafes or the empty state", async ({ page }) => {
    const hrefs = await listedCafeHrefs(page);
    if (hrefs.length === 0) {
      await expect(page.getByText("First reviews soon.")).toBeVisible();
      return;
    }
    for (const href of hrefs) {
      await page.goto(href);
      await expect(page.getByText(/visited \d{4}-\d{2}-\d{2}/).first(), `${href} has no published review`).toBeVisible();
    }
  });

  test("home shows reviewed cafes or the empty state", async ({ page }) => {
    await page.goto("/");
    const cards = page.getByRole("main").locator('a[href^="/cafes/"]');
    if ((await cards.count()) === 0) await expect(page.getByText("First reviews soon.")).toBeVisible();
  });

  test('no "3 sips" placeholder text anywhere', async ({ page }) => {
    // A score label must match a real score shown by its cup. The old fallback rendered
    // "3 sips" for unscored (0) or half-point (4.5) values.
    const urls = ["/", "/cafes", ...(await listedCafeHrefs(page))];
    for (const url of urls) {
      await page.goto(url);
      const cups = await page
        .locator('[aria-label$="out of 5 sips"]')
        .evaluateAll((els) => els.map((el) => Number.parseFloat(el.getAttribute("aria-label") ?? "")));
      expect(cups.filter((n) => !(n >= 1 && n <= 5)), `${url} shows a cup for a missing score`).toEqual([]);
      const labels = (await page.getByRole("main").innerText()).match(/\b\d(?:\.5)? sips?\b/g) ?? [];
      for (const label of labels) {
        expect(cups, `${url}: "${label}" has no matching cup`).toContain(Number.parseFloat(label));
      }
    }
  });

  test("/cafes keeps its full-width layout at 375px, also when empty", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/cafes");
    // With nothing listed, a shrink-to-fit <main> pulled the heading off its left edge.
    const main = await page.getByRole("main").boundingBox();
    expect(main?.x).toBe(0);
    expect(main?.width).toBe(375);
  });

  test("the map is unlinked: no nav link or home CTA", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator('a[href="/map"]')).toHaveCount(0);
  });

  for (const url of ["/want-to-go", "/design-system", "/design-preview"]) {
    test(`${url} redirects to /login when logged out`, async ({ page }) => {
      await page.goto(url);
      await expect(page).toHaveURL(/\/login$/);
    });
  }
});

test.describe("security", () => {
  // Static pages are the ones that silently lose the nonce if the root layout's
  // `connection()` goes away, so they're the important ones here.
  const csPages = ["/", "/cafes", "/map", "/stories", "/about", "/login"];

  test("every page sends a CSP and every <script> carries its nonce", async ({ request }) => {
    for (const url of csPages) {
      const nonces: string[] = [];
      // Two requests: a prerendered page would serve the same nonce twice.
      for (let i = 0; i < 2; i++) {
        const res = await request.get(url);
        expect(res.status(), url).toBe(200);
        const csp = res.headers()["content-security-policy"];
        expect(csp, `${url} has no CSP header`).toBeTruthy();
        const nonce = csp.match(/'nonce-([^']+)'/)?.[1];
        expect(nonce, `${url} CSP has no nonce`).toBeTruthy();
        nonces.push(nonce!);

        // Raw HTML, not the DOM: browsers hide the nonce attribute after parsing.
        const scripts = (await res.text()).match(/<script\b[^>]*>/g) ?? [];
        expect(scripts.length, `${url} has no scripts`).toBeGreaterThan(0);
        for (const tag of scripts) {
          expect(tag, `${url} script without the CSP nonce`).toContain(`nonce="${nonce}"`);
        }
      }
      expect(nonces[0], `${url} served the same nonce twice`).not.toBe(nonces[1]);
    }
  });

  test("/admin redirects to /login when logged out", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("button", { name: "Send magic link" })).toBeVisible();
  });

  test("a draft story 404s and isn't listed", async ({ page, request }) => {
    const draft = await findDraftSlug();
    test.skip(!draft, "no draft post in content/blog to test against");

    const res = await request.get(`/stories/${draft}`);
    expect(res.status()).toBe(404);

    await page.goto("/stories");
    await expect(page.locator(`a[href="/stories/${draft}"]`)).toHaveCount(0);
  });

  test("path-traversal story slugs 404", async ({ request }) => {
    // Percent-encoded so the URL isn't normalised before it reaches Next.
    for (const slug of ["..%2F..%2Fpackage", "..%2F..%2F.env.local", "%2E%2E%2Fhello-sips"]) {
      // /stories directly, not through the /blog redirect.
      const res = await request.get(`/stories/${slug}`);
      expect(res.status(), slug).toBe(404);
      expect(await res.text(), slug).not.toContain('"dependencies"');
    }
  });
});

/** Detail-page links on /cafes, de-duplicated (a card may hold more than one link). */
async function listedCafeHrefs(page: Page): Promise<string[]> {
  await page.goto("/cafes");
  const hrefs = await page
    .getByRole("main")
    .locator('a[href^="/cafes/"]')
    .evaluateAll((links) => links.map((a) => a.getAttribute("href") ?? ""));
  return [...new Set(hrefs.filter((h) => /^\/cafes\/[a-z0-9-]+$/.test(h)))];
}

/**
 * First post in content/blog whose frontmatter has a `draft` key that isn't YAML boolean
 * `false` (lib/blog.ts publishes only on that). YAML 1.2 reads false/False/FALSE as false;
 * a quoted "false" is a string, so still a draft.
 */
async function findDraftSlug(): Promise<string | null> {
  const dir = path.join(process.cwd(), "content", "blog");
  for (const file of await readdir(dir)) {
    if (!file.endsWith(".mdx")) continue;
    const source = await readFile(path.join(dir, file), "utf8");
    const frontmatter = source.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? "";
    const draft = frontmatter.match(/^draft:\s*(.*)$/m)?.[1]?.replace(/\s+#.*$/, "").trim();
    const isFalse = draft !== undefined && ["false", "False", "FALSE"].includes(draft);
    if (draft !== undefined && !isFalse) return file.replace(/\.mdx$/, "");
  }
  return null;
}
