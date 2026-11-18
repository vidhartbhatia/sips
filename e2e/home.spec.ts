import { expect, test, type Page } from "@playwright/test";
import {
  attachScreenshot,
  expectA11y,
  expectNoHorizontalScroll,
  expectVisibleFromServer,
  trackErrors,
} from "./helpers";

/**
 * Home, /cafes, About and the 404s (PR H). Runs on both projects (desktop and 375px).
 *
 * The listing states run against the env-gated fixtures (`/fixtures/home/<case>`,
 * `/fixtures/cafes/<case>`), because the live database has no published reviews yet. The live
 * pages are only checked to render. Read-only throughout.
 */

const cardLinks = (page: Page) => page.getByRole("main").locator('a[href^="/cafes/"]');

async function expectBoxesApart(page: Page) {
  const h1 = await page.getByRole("heading", { level: 1 }).boundingBox();
  const art = await page.locator("[data-hero-art] img").boundingBox();
  expect(h1, "h1 box").not.toBeNull();
  expect(art, "hero art box").not.toBeNull();
  if (!h1 || !art) return;
  const apart =
    h1.x + h1.width <= art.x || art.x + art.width <= h1.x || h1.y + h1.height <= art.y || art.y + art.height <= h1.y;
  expect(apart, `hero art ${JSON.stringify(art)} overlaps the h1 ${JSON.stringify(h1)}`).toBe(true);
}

test.describe("home fixtures", () => {
  const HOME_CASES = { empty: "First reviews soon.", one: "Fixture Roasters", two: "Test Pattern Coffee", six: "Stub & Saucer" };

  for (const [name, text] of Object.entries(HOME_CASES)) {
    test(`${name}: accessible, no sideways scroll, server-rendered, hero clear of the h1`, async ({
      page,
      request,
    }, testInfo) => {
      const url = `/fixtures/home/${name}`;
      const errors = trackErrors(page);
      await page.goto(url);
      await attachScreenshot(page, testInfo, `${testInfo.project.name}-home-${name}`);
      await expect(page.getByRole("heading", { level: 1, name: "Sips" })).toBeVisible();
      await expectA11y(page);
      await expectNoHorizontalScroll(page);
      await expectVisibleFromServer(request, url, text);
      await expectBoxesApart(page);
      expect(errors).toEqual([]);
    });
  }

  test("empty: the empty state, no cafe links, no count labels", async ({ page }) => {
    await page.goto("/fixtures/home/empty");
    await expect(page.getByRole("heading", { level: 2, name: "First reviews soon." })).toBeVisible();
    await expect(cardLinks(page)).toHaveCount(0);
    await expect(page.getByRole("link", { name: /see all cafes/i })).toHaveCount(0);
    const text = await page.getByRole("main").innerText();
    expect(text).not.toMatch(/\bsips?\b.*\d|\d.*\bsips?\b/i);
  });

  test("one: a single featured card with its verdict", async ({ page }) => {
    await page.goto("/fixtures/home/one");
    await expect(cardLinks(page)).toHaveCount(1);
    await expect(page.getByText("A cortado worth crossing town for.")).toBeVisible();
    await expect(page.getByRole("img", { name: "Score 4.5 out of 5, 2 visits" })).toBeVisible();
  });

  test("six: six cards, the coverless one has no image or placeholder", async ({ page }) => {
    await page.goto("/fixtures/home/six");
    await expect(cardLinks(page)).toHaveCount(6);
    const coverless = cardLinks(page).filter({ hasText: "Sample Matcha House" });
    await expect(coverless.locator("img")).toHaveCount(0);
    await expect(coverless.locator("svg")).toHaveCount(0);
    await expect(page.getByRole("link", { name: /see all cafes/i })).toHaveAttribute("href", "/cafes");
  });
});

test("live / renders the empty state or cards", async ({ page }) => {
  const errors = trackErrors(page);
  const response = await page.goto("/");
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1, name: "Sips" })).toBeVisible();
  if ((await cardLinks(page).count()) === 0) {
    await expect(page.getByText("First reviews soon.")).toBeVisible();
  }
  expect(errors).toEqual([]);
});

test.describe("/cafes fixtures", () => {
  for (const name of ["empty", "two", "six"]) {
    test(`${name}: accessible, no sideways scroll`, async ({ page }, testInfo) => {
      await page.goto(`/fixtures/cafes/${name}`);
      await attachScreenshot(page, testInfo, `${testInfo.project.name}-cafes-${name}`);
      await expect(page.getByRole("heading", { level: 1, name: "All Cafes" })).toBeVisible();
      await expectA11y(page);
      await expectNoHorizontalScroll(page);
    });
  }

  test("empty: the empty state", async ({ page }) => {
    await page.goto("/fixtures/cafes/empty");
    await expect(page.getByRole("heading", { level: 2, name: "First reviews soon." })).toBeVisible();
    await expect(cardLinks(page)).toHaveCount(0);
  });

  test("two: no filter bar", async ({ page }) => {
    await page.goto("/fixtures/cafes/two");
    await expect(cardLinks(page)).toHaveCount(2);
    await expect(page.getByLabel("Neighborhood", { exact: true })).toHaveCount(0);
  });

  test("six: filters by score, labelled, keyboard-reachable", async ({ page }) => {
    await page.goto("/fixtures/cafes/six");
    await expect(cardLinks(page)).toHaveCount(6);

    for (const select of await page.getByRole("combobox").all()) {
      await expect(select).toHaveAccessibleName(/\S/);
    }

    await page.getByLabel("Score", { exact: true }).selectOption({ label: "4+" });
    await expect(cardLinks(page)).toHaveCount(3);
    const scores = await page
      .getByRole("main")
      .getByRole("img", { name: /^Score / })
      .evaluateAll((els) => els.map((el) => Number.parseFloat((el.getAttribute("aria-label") ?? "").slice(6))));
    expect(scores.length).toBe(3);
    for (const s of scores) expect(s).toBeGreaterThanOrEqual(4);

    await page.getByLabel("Search", { exact: true }).fill("no such cafe");
    await expect(page.getByText("No cafes match.")).toBeVisible();
    await page.getByRole("button", { name: "Clear filters" }).click();
    await expect(cardLinks(page)).toHaveCount(6);

    const search = page.getByRole("searchbox", { name: "Search" });
    await page.locator("body").focus();
    for (let i = 0; i < 30 && !(await search.evaluate((el) => el === document.activeElement)); i++) {
      await page.keyboard.press("Tab");
    }
    await expect(search).toBeFocused();
  });
});

test.describe("about", () => {
  test("names Lea and Vids and gives the scale exactly", async ({ page, request }, testInfo) => {
    await page.goto("/about");
    await attachScreenshot(page, testInfo, `${testInfo.project.name}-about`);
    await expect(page.getByRole("heading", { level: 1, name: "About Sips" })).toBeVisible();
    const main = page.getByRole("main");
    await expect(main).toContainText("Lea");
    await expect(main).toContainText("Vids");

    const rows = await main.locator("dl > div").evaluateAll((els) =>
      els.map((el) =>
        [el.querySelector("dt")?.textContent, el.querySelector("dd")?.textContent].map((t) => t?.trim()).join(" "),
      ),
    );
    expect(rows).toEqual(["5 go out of your way", "4 we'd return", "3 fine", "2 skip", "1 no"]);
    await expect(main).toContainText(
      "Each drink and each visit gets a whole number. A cafe's score is the average of our visits, rounded to the nearest half.",
    );
    await expectVisibleFromServer(request, "/about", "How we score");
    await expectA11y(page);
    await expectNoHorizontalScroll(page);
  });
});

for (const url of ["/fixtures/home/six", "/fixtures/home/empty", "/about"]) {
  test(`${url}: one divider, not full-bleed`, async ({ page }) => {
    await page.goto(url);
    const dividers = page.locator('main img[src*="/illustrations/dividers/"]');
    await expect(dividers).toHaveCount(1);
    const box = await dividers.first().boundingBox();
    expect(box?.width ?? Infinity).toBeLessThanOrEqual(384);
  });
}

test.describe("404s", () => {
  test("an unknown page 404s with a way home", async ({ page, request }, testInfo) => {
    expect((await request.get("/no-such-page")).status()).toBe(404);
    await page.goto("/no-such-page");
    await attachScreenshot(page, testInfo, `${testInfo.project.name}-404`);
    await expect(page.getByRole("heading", { level: 1, name: "Nothing brewing here." })).toBeVisible();
    await expect(page.getByRole("main").getByRole("link", { name: "Back home" })).toHaveAttribute("href", "/");
    await expectA11y(page);
    await expectNoHorizontalScroll(page);
  });

  test("an unknown cafe 404s with a way to the list", async ({ page, request }, testInfo) => {
    expect((await request.get("/cafes/no-such-cafe")).status()).toBe(404);
    await page.goto("/cafes/no-such-cafe");
    await attachScreenshot(page, testInfo, `${testInfo.project.name}-cafe-404`);
    await expect(page.getByRole("heading", { level: 1, name: "Cafe not found" })).toBeVisible();
    await expect(page.getByRole("main").getByRole("link", { name: "All cafes" })).toHaveAttribute("href", "/cafes");
    await expectA11y(page);
    await expectNoHorizontalScroll(page);
  });
});
