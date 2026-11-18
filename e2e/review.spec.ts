import { expect, test, type Locator, type Page } from "@playwright/test";
import {
  attachScreenshot,
  expectA11y,
  expectNoHorizontalScroll,
  expectVisibleFromServer,
  trackErrors,
} from "./helpers";

/**
 * The review page (layout A) on the env-gated fixture routes (`/fixtures/review/{case}`,
 * data in app/fixtures/review/cases.ts). Runs on desktop and the 375px project. Read-only.
 * The `draft` case renders as the admin preview does (lead visit plus banner).
 */

const CASES = {
  single: "Larkspur Coffee",
  multi: "Larkspur Coffee",
  bare: "Larkspur Coffee",
  long: "The Very Long Name Coffee & Tea Roasters",
  draft: "Larkspur Coffee",
} as const;

const url = (name: keyof typeof CASES) => `/fixtures/review/${name}`;

async function top(locator: Locator): Promise<number> {
  const box = await locator.boundingBox();
  expect(box, "element has a layout box").not.toBeNull();
  return box?.y ?? 0;
}

async function ratio(locator: Locator): Promise<number> {
  const box = await locator.boundingBox();
  expect(box, "element has a layout box").not.toBeNull();
  return box ? box.width / box.height : 0;
}

/** Every image in <main> is described or explicitly hidden from assistive tech. */
async function expectImagesLabelled(page: Page): Promise<void> {
  const unlabelled = await page.locator("main img").evaluateAll((imgs) =>
    imgs
      .filter((img) => !(img.getAttribute("alt") ?? "").trim() && img.getAttribute("aria-hidden") !== "true")
      .map((img) => img.outerHTML.slice(0, 120)),
  );
  expect(unlabelled).toEqual([]);
}

for (const [name, cafeName] of Object.entries(CASES) as [keyof typeof CASES, string][]) {
  test.describe(`fixture: ${name}`, () => {
    test("passes axe, fits the viewport, renders from the server, labels images", async ({ page, request }, testInfo) => {
      const errors = trackErrors(page);
      await page.goto(url(name));
      await attachScreenshot(page, testInfo, `${testInfo.project.name}-review-${name}`);
      await expectNoHorizontalScroll(page);
      await expectImagesLabelled(page);
      await expectA11y(page);
      await expectVisibleFromServer(request, url(name), cafeName);
      expect(errors).toEqual([]);
    });
  });
}

test("single: sections come in layout-A order", async ({ page }) => {
  await page.goto(url("single"));
  const ids = ["review-hero", "review-meta", "review-verdict", "review-score", "what-we-tried", "review-story", "photo-strip"];
  const ys: number[] = [];
  for (const id of ids) ys.push(await top(page.getByTestId(id)));
  expect(ys).toEqual([...ys].sort((a, b) => a - b));
  expect(new Set(ys).size).toBe(ys.length);
});

test("single: hero is 3:2 and drink photos are 4:5", async ({ page }) => {
  await page.goto(url("single"));
  expect(Math.abs((await ratio(page.getByTestId("review-hero"))) - 1.5)).toBeLessThanOrEqual(0.02);
  const drinkPhoto = page.getByTestId("what-we-tried").locator("img").first().locator("..");
  expect(Math.abs((await ratio(drinkPhoto)) - 0.8)).toBeLessThanOrEqual(0.02);
});

test("single: meta line, score name and a single h1", async ({ page }) => {
  await page.goto(url("single"));
  await expect(page.getByTestId("review-meta")).toHaveText(/· BY LEA$/i);
  await expect(page.getByTestId("review-score").getByRole("img", { name: "Score 4 out of 5" })).toBeVisible();
  const h1 = page.getByRole("heading", { level: 1 });
  await expect(h1).toHaveCount(1);
  await expect(h1).toHaveText(CASES.single);
});

test("multi: cafe score counts visits; earlier visits open from the keyboard", async ({ page }) => {
  await page.goto(url("multi"));
  const score = page.getByTestId("review-score");
  await expect(score).toContainText("4.5");
  await expect(score).toContainText("3 visits");

  const visits = page.getByTestId("earlier-visits").locator("details");
  await expect(visits).toHaveCount(2);
  const first = visits.first();
  await expect(first.getByText("Flat white", { exact: true })).toBeHidden();

  // Tab from the top of the page until the first earlier-visit summary has focus.
  let onSummary = false;
  for (let i = 0; i < 60 && !onSummary; i++) {
    await page.keyboard.press("Tab");
    onSummary = await first.locator("summary").evaluate((el) => el === document.activeElement);
  }
  expect(onSummary, "reached the first summary by tabbing").toBe(true);
  await page.keyboard.press("Enter");
  await expect(first).toHaveAttribute("open", "");
  await expect(first.getByText("Flat white", { exact: true })).toBeVisible();
});

test("multi: opened earlier visits pass axe and fit the viewport", async ({ page }) => {
  // Closed <details> content is never checked by the per-case test; open every one first.
  // A fresh load, so no header link is mid colour-transition from a keyboard walk.
  await page.goto(url("multi"));
  await page.getByTestId("earlier-visits").locator("details").evaluateAll((all) => {
    for (const d of all) (d as HTMLDetailsElement).open = true;
  });
  await expect(page.getByTestId("earlier-visits").getByText("Flat white", { exact: true })).toBeVisible();
  await expectA11y(page);
  await expectNoHorizontalScroll(page);
});

test("bare: empty sections are left out entirely", async ({ page }) => {
  await page.goto(url("bare"));
  for (const id of ["what-we-tried", "review-story", "photo-strip", "review-hero", "earlier-visits"]) {
    await expect(page.getByTestId(id), id).toHaveCount(0);
  }
  await expect(page.getByTestId("review-meta")).not.toContainText(/\bby\b/i);
  // Only decorative art (the divider) is left: no photo frames.
  await expect(page.locator('main img:not([aria-hidden="true"])')).toHaveCount(0);
});

test("long: nothing scrolls sideways", async ({ page }) => {
  await page.goto(url("long"));
  await expectNoHorizontalScroll(page);
  await expect(page.getByTestId("what-we-tried").locator("li")).toHaveCount(8);
  await expect(page.getByTestId("review-story").locator("p")).toHaveCount(6);
});

test("draft preview: the draft leads, the banner says why it can't publish, the score includes it", async ({ page }) => {
  await page.goto(url("draft"));
  const banner = page.getByRole("status");
  await expect(banner).toContainText("Draft preview: only you can see this.");
  await expect(banner).toContainText("Score every drink before publishing: Cortado.");
  await expect(banner.getByRole("link", { name: "Edit" })).toHaveAttribute("href", "/admin/review/d-draft/edit");
  await expect(page.getByTestId("review-verdict")).toHaveText("Lovely room, but the espresso ran thin today.");
  await expect(
    page.getByTestId("review-score").getByRole("img", { name: "Score 4 out of 5, 2 visits" }),
  ).toBeVisible();
  await expect(page.getByTestId("earlier-visits").locator("details")).toHaveCount(1);
});

test("admin preview: logged out, it redirects to /login", async ({ request }) => {
  const response = await request.get("/admin/review/00000000-0000-0000-0000-000000000000/preview", {
    maxRedirects: 0,
  });
  expect([302, 303, 307, 308]).toContain(response.status());
  expect(new URL(response.headers()["location"] ?? "", "http://localhost").pathname).toBe("/login");
});

/**
 * A layout-A page as the public sees it: the site shell, no console errors, every image
 * loaded (earlier visits opened first, since closed `<details>` never load theirs), and no
 * section that renders its frame but nothing in it.
 */
async function expectLayoutAPage(page: Page, href: string): Promise<void> {
  const errors = trackErrors(page);
  const response = await page.goto(href);
  expect(response?.status(), `${href} status`).toBe(200);

  await expect(page.getByTestId("review-meta")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("banner")).toBeVisible();
  await expect(page.getByRole("contentinfo")).toBeVisible();

  await page.locator("main details").evaluateAll((all) => {
    for (const d of all) (d as HTMLDetailsElement).open = true;
  });
  const images = page.locator("main img");
  const count = await images.count();
  for (let i = 0; i < count; i++) {
    const img = images.nth(i);
    // next/image lazy-loads everything below the hero: bring each into view, then wait.
    await img.scrollIntoViewIfNeeded();
    await expect
      .poll(
        () => img.evaluate((el) => (el as HTMLImageElement).complete && (el as HTMLImageElement).naturalWidth > 0),
        { message: `${href}: image ${i} (${await img.getAttribute("src")}) did not load` },
      )
      .toBe(true);
  }

  // Sections are left out when empty, so any that render must hold something.
  for (const [id, child] of [
    ["review-hero", "img"],
    ["photo-strip", "img"],
    ["what-we-tried", "li"],
  ] as const) {
    const section = page.getByTestId(id);
    if ((await section.count()) === 0) continue;
    expect(await section.locator(child).count(), `${href}: empty ${id}`).toBeGreaterThan(0);
  }

  expect(errors, `errors on ${href}:\n${errors.join("\n")}`).toEqual([]);
}

// The live check below skips until a review is published, so run the same checks on the
// fixtures now: the first real run must not be the day L. publishes.
for (const name of ["single", "multi"] as const) {
  test(`${name}: passes the live-page checks (shell, images, no empty sections)`, async ({ page }) => {
    await expectLayoutAPage(page, url(name));
  });
}

test("single: every drink name lines up, with or without a picture", async ({ page }) => {
  await page.goto(url("single"));
  const names = page.getByTestId("what-we-tried").locator("li p.font-semibold");
  await expect(names).toHaveCount(3);
  const xs = await names.evaluateAll((els) => els.map((el) => Math.round(el.getBoundingClientRect().x)));
  expect(new Set(xs).size, `drink names start at x = ${xs.join(", ")}`).toBe(1);
});

test("live: every listed cafe opens a layout-A page", async ({ page }) => {
  // Live data, read-only. CI's service key is a placeholder, so no photo signs there and
  // every photo must be dropped cleanly (no broken <img>, no empty strip).
  const response = await page.goto("/cafes");
  expect(response?.status(), "/cafes status").toBe(200);
  const hrefs = await page
    .getByRole("main")
    .locator('a[href^="/cafes/"]')
    .evaluateAll((links) => links.map((a) => a.getAttribute("href") ?? ""));
  const listed = [...new Set(hrefs.filter((h) => /^\/cafes\/[a-z0-9-]+$/.test(h)))];
  if (listed.length === 0) {
    // Skip only on a real empty state, never because the listing broke.
    await expect(page.getByText("First reviews soon.")).toBeVisible();
    test.skip(true, "no published reviews yet");
  }
  // A bounded sample, so CI time doesn't grow with the journal.
  const sample = listed.slice(0, 3);
  test.setTimeout(30_000 * sample.length);
  for (const href of sample) await expectLayoutAPage(page, href);
});
