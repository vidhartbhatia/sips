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
    { url: "/blog", heading: "Blog" },
    { url: "/about", heading: "About Sips" },
  ];

  for (const { url, heading } of pages) {
    test(`${url} returns 200 with no console errors`, async ({ page }) => {
      await expectCleanPage(page, url, heading);
    });
  }

  test("a cafe detail page renders", async ({ page }) => {
    await page.goto("/cafes");
    const firstCafe = page.getByRole("main").locator('a[href^="/cafes/"]').first();
    await expect(firstCafe, "the cafes list is empty, so no detail page to test").toBeVisible();
    const href = await firstCafe.getAttribute("href");
    expect(href).toMatch(/^\/cafes\/[a-z0-9-]+$/);

    const errors = trackErrors(page);
    const response = await page.goto(href!);
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    expect(errors, errors.join("\n")).toEqual([]);
  });

  test("/map mounts the map canvas", async ({ page }) => {
    const errors = trackErrors(page);
    const response = await page.goto("/map");
    expect(response?.status()).toBe(200);
    // Asserts the canvas mounts, not that tiles render: the Mapbox token is URL-restricted.
    await expect(page.locator("canvas.mapboxgl-canvas")).toBeVisible();
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

test.describe("security", () => {
  // Static pages are the ones that silently lose the nonce if the root layout's
  // `connection()` goes away, so they're the important ones here.
  const csPages = ["/", "/cafes", "/map", "/blog", "/about", "/login"];

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

  test("a draft blog post 404s and isn't listed", async ({ page, request }) => {
    const draft = await findDraftSlug();
    test.skip(!draft, "no draft post in content/blog to test against");

    const res = await request.get(`/blog/${draft}`);
    expect(res.status()).toBe(404);

    await page.goto("/blog");
    await expect(page.locator(`a[href="/blog/${draft}"]`)).toHaveCount(0);
  });

  test("path-traversal blog slugs 404", async ({ request }) => {
    // Percent-encoded so the URL isn't normalised before it reaches Next.
    for (const slug of ["..%2F..%2Fpackage", "..%2F..%2F.env.local", "%2E%2E%2Fhello-sips"]) {
      const res = await request.get(`/blog/${slug}`);
      expect(res.status(), slug).toBe(404);
      expect(await res.text(), slug).not.toContain('"dependencies"');
    }
  });
});

/** First post in content/blog whose frontmatter has a `draft` key that isn't literal `false`. */
async function findDraftSlug(): Promise<string | null> {
  const dir = path.join(process.cwd(), "content", "blog");
  for (const file of await readdir(dir)) {
    if (!file.endsWith(".mdx")) continue;
    const source = await readFile(path.join(dir, file), "utf8");
    const frontmatter = source.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? "";
    const draft = frontmatter.match(/^draft:\s*(.*)$/m)?.[1]?.trim();
    if (draft !== undefined && draft !== "false") return file.replace(/\.mdx$/, "");
  }
  return null;
}
