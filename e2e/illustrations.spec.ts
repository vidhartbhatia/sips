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
  const imgs = await page.locator("main img").evaluateAll((els) =>
    (els as HTMLImageElement[]).map((img) => ({
      src: img.currentSrc,
      ok: img.complete && img.naturalWidth > 0,
      // in px: a ratio tolerance can't tell 1px of rounding on a 13px-tall divider from a squash
      drift: Math.abs(img.height - (img.width * img.naturalHeight) / img.naturalWidth),
    })),
  );
  for (const img of imgs) {
    expect(img.ok, img.src).toBe(true);
    expect(img.drift, img.src).toBeLessThanOrEqual(2); // both sides are rounded; a squash is tens of px
  }

  await expectNoHorizontalScroll(page);
  await attachScreenshot(page, testInfo, "illustrations");
  expect(errors).toEqual([]);
});
