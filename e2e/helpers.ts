import AxeBuilder from "@axe-core/playwright";
import { expect, type APIRequestContext, type Page, type TestInfo } from "@playwright/test";

/**
 * Shared helpers for the layout and accessibility specs. All read-only.
 * Spec files import these; the smoke suite keeps its own copies.
 */

type AxeResults = Awaited<ReturnType<AxeBuilder["analyze"]>>;
type AxeResult = AxeResults["violations"][number];

const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21aa"];

/** Hides the fixed paper-grain overlay (opacity 0.03), which can make axe skip contrast. */
const HIDE_PAPER_OVERLAY = "body::before{display:none !important}";

/** Collects console errors and uncaught exceptions. Attach before `goto`. */
export function trackErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(`console: ${msg.text()}`);
  });
  page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`));
  return errors;
}

/**
 * The page is no wider than the viewport: nothing forces a sideways scroll.
 *
 * Compares against the configured viewport width, not only `innerWidth`: with `isMobile`,
 * Chromium widens `innerWidth` to fit overflowing content (a 2000px element on the 375px
 * project gave `innerWidth` 1500), so `scrollWidth <= innerWidth` alone can pass on a page
 * that scrolls sideways.
 */
export async function expectNoHorizontalScroll(page: Page): Promise<void> {
  const { scrollWidth, innerWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }));
  const width = Math.min(innerWidth, page.viewportSize()?.width ?? innerWidth);
  expect(scrollWidth, `page is ${scrollWidth}px wide in a ${width}px viewport`).toBeLessThanOrEqual(width);
}

function formatAxe(results: AxeResult[]): string {
  return results
    .map((r) => {
      const targets = r.nodes
        .slice(0, 5)
        .map((n) => `    ${n.target.join(" ")}`)
        .join("\n");
      const more = r.nodes.length > 5 ? `\n    …and ${r.nodes.length - 5} more` : "";
      return `  ${r.id} (${r.impact ?? "n/a"}): ${r.help}\n${targets}${more}`;
    })
    .join("\n");
}

const contrastIncomplete = (results: AxeResults): AxeResult[] =>
  results.incomplete.filter((r) => r.id === "color-contrast");

/**
 * Runs axe (WCAG 2.0 A/AA and 2.1 AA) and fails on any violation.
 *
 * Also fails if `color-contrast` comes back `incomplete`: "zero violations" has to mean the
 * contrast was actually checked. If the paper overlay is what made axe give up, it is hidden
 * and the page re-analysed (at 0.03 opacity it doesn't change contrast).
 */
export async function expectA11y(page: Page): Promise<void> {
  const analyze = () => new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();

  let results = await analyze();
  if (contrastIncomplete(results).length > 0) {
    await page.addStyleTag({ content: HIDE_PAPER_OVERLAY });
    results = await analyze();
  }

  expect(results.violations, `axe violations on ${page.url()}:\n${formatAxe(results.violations)}`).toEqual(
    [],
  );
  const unchecked = contrastIncomplete(results);
  expect(unchecked, `color-contrast not checked on ${page.url()}:\n${formatAxe(unchecked)}`).toEqual([]);
}

/** Pulls the `<main>` markup out of a server-rendered page. */
function mainMarkup(html: string): string | null {
  const start = html.search(/<main[\s>]/);
  const end = html.lastIndexOf("</main>");
  if (start === -1 || end === -1 || end < start) return null;
  return html.slice(start, end + "</main>".length);
}

const ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#x27;": "'",
  "&#39;": "'",
  "&nbsp;": " ",
};

/**
 * Text content of server HTML: script and style bodies, comments and tags dropped, entities
 * decoded, spaces collapsed.
 */
function textOf(markup: string): string {
  return markup
    .replace(/<(script|style|template)\b[\s\S]*?<\/\1>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&(?:amp|lt|gt|quot|nbsp|#x27|#39);/g, (e) => ENTITIES[e] ?? e)
    .replace(/\s+/g, " ");
}

/**
 * Matches an `opacity:0` (or `0.0`) declaration in a style attribute, but not `opacity:0.5`
 * or `fill-opacity:0` / `stroke-opacity:0`.
 */
const INLINE_HIDDEN = /style="(?:[^"]*;)?\s*opacity:\s*0(?:\.0+)?(?![.\d])/;

/**
 * The server HTML for `url` already shows `text` inside `<main>`, with nothing hidden by an
 * inline `opacity:0` waiting for client JS. `<title>` and the RSC payload don't count.
 */
export async function expectVisibleFromServer(
  request: APIRequestContext,
  url: string,
  text: string,
): Promise<void> {
  const response = await request.get(url);
  expect(response.status(), `${url} status`).toBe(200);
  const main = mainMarkup(await response.text());
  expect(main, `${url} has no <main> in its server HTML`).not.toBeNull();
  const markup = main ?? "";
  expect(textOf(markup), `${url} server HTML <main> text`).toContain(text.replace(/\s+/g, " "));
  expect(markup.match(INLINE_HIDDEN)?.[0], `${url} renders content with inline opacity:0`).toBeUndefined();
}

/** Attaches a full-page screenshot to the test report. Never compared against a baseline. */
export async function attachScreenshot(page: Page, testInfo: TestInfo, name: string): Promise<void> {
  await testInfo.attach(name, {
    body: await page.screenshot({ fullPage: true }),
    contentType: "image/png",
  });
}
