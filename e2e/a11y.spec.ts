import { test } from "@playwright/test";
import { attachScreenshot, expectA11y, expectNoHorizontalScroll } from "./helpers";

/**
 * Accessibility and layout checks on public pages. Runs on both projects (desktop and the
 * 375px mobile one). Read-only: pages read the live database through the anon key.
 *
 * Axe and the horizontal-scroll check are separate tests, so a `fixme` on one never hides the
 * other.
 */

const PAGES = ["/about", "/cafes"];

for (const url of PAGES) {
  test.describe(url, () => {
    test("has no axe violations and contrast was checked", async ({ page }, testInfo) => {
      await page.goto(url);
      await attachScreenshot(page, testInfo, `${testInfo.project.name}${url.replaceAll("/", "-")}`);
      await expectA11y(page);
    });

    test("does not scroll sideways", async ({ page }) => {
      await page.goto(url);
      await expectNoHorizontalScroll(page);
    });
  });
}
