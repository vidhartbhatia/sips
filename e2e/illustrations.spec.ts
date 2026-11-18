import { expect, test } from "@playwright/test";
import { attachScreenshot, expectNoHorizontalScroll, trackErrors } from "./helpers";

// K1: every illustration slot on cream at 64px and 240px, plus the hero under a headline.
// Runs on both projects (desktop and 375px mobile); the screenshots are for the owner's check.
test("illustration fixture renders every slot without a box", async ({ page }, testInfo) => {
  const errors = trackErrors(page);
  const res = await page.goto("/fixtures/illustrations");
  expect(res?.status()).toBe(200);

  const hero = page.locator("main img").first();
  await expect(hero).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  // 4 spots + 4 doodles + 2 ornaments
  expect(await page.locator("[data-slot]").count()).toBeGreaterThanOrEqual(10);

  // Every image decoded (no broken src) and kept its aspect ratio.
  // next/image lazy-loads, so force-load and decode each one before reading it.
  const imgs = await page.locator("main img").evaluateAll((els) =>
    Promise.all(
      (els as HTMLImageElement[]).map(async (img) => {
        img.loading = "eager";
        const ok = await img.decode().then(
          () => img.naturalWidth > 0,
          () => false,
        );
        return {
          src: img.currentSrc || img.src,
          ok,
          // in px: a ratio tolerance can't tell 1px of rounding on a 13px-tall divider from a squash
          drift: Math.abs(img.height - (img.width * img.naturalHeight) / img.naturalWidth),
        };
      }),
    ),
  );
  for (const img of imgs) {
    expect(img.ok, img.src).toBe(true);
    expect(img.drift, img.src).toBeLessThanOrEqual(2); // both sides are rounded; a squash is tens of px
  }

  await expectNoHorizontalScroll(page);
  await attachScreenshot(page, testInfo, "illustrations");
  expect(errors).toEqual([]);
});

// The live pages that render a slot today (the divider); H and I move the rest onto slots.
for (const url of ["/", "/about"]) {
  test(`${url} renders the new divider`, async ({ page }, testInfo) => {
    const res = await page.goto(url);
    expect(res?.status()).toBe(200);
    const divider = page.locator('main img[src*="/illustrations/dividers/"]').first();
    await divider.scrollIntoViewIfNeeded();
    await expect(divider).toBeVisible();
    const decoded = await divider.evaluate((img: HTMLImageElement) =>
      img.decode().then(
        () => img.naturalWidth > 0,
        () => false,
      ),
    );
    expect(decoded).toBe(true);
    await expectNoHorizontalScroll(page);
    await attachScreenshot(page, testInfo, `page${url === "/" ? "-home" : url.replaceAll("/", "-")}`);
  });
}
