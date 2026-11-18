import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { test, expect } from "@playwright/test";
import { attachScreenshot, expectA11y, expectNoHorizontalScroll, trackErrors } from "./helpers";

/**
 * Stories (MDX posts in content/blog, served at /stories). Read-only. Runs on both projects.
 */

const BLOG_DIR = path.join(process.cwd(), "content", "blog");

/**
 * The frontmatter `draft` value of each post. Same rule as the smoke spec's draft helper and
 * lib/blog.ts: a post is published only with no `draft` key or a YAML boolean `false`
 * (false/False/FALSE). A quoted "false" is a string, so still a draft.
 */
async function postsByState(): Promise<{ published: string[]; drafts: string[] }> {
  const published: string[] = [];
  const drafts: string[] = [];
  for (const file of await readdir(BLOG_DIR)) {
    if (!file.endsWith(".mdx")) continue;
    const source = await readFile(path.join(BLOG_DIR, file), "utf8");
    const frontmatter = source.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? "";
    const draft = frontmatter.match(/^draft:\s*(.*)$/m)?.[1]?.replace(/\s+#.*$/, "").trim();
    const isPublished = draft === undefined || ["false", "False", "FALSE"].includes(draft);
    (isPublished ? published : drafts).push(file.replace(/\.mdx$/, ""));
  }
  return { published, drafts };
}

test.describe("/stories", () => {
  test("returns 200 with the Stories heading and no console errors", async ({ page }, testInfo) => {
    const errors = trackErrors(page);
    const response = await page.goto("/stories");
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1, name: "Stories" })).toBeVisible();
    await attachScreenshot(page, testInfo, `${testInfo.project.name}-stories`);
    expect(errors, errors.join("\n")).toEqual([]);
  });

  test("has no axe violations and contrast was checked", async ({ page }) => {
    await page.goto("/stories");
    await expectA11y(page);
  });

  test("does not scroll sideways", async ({ page }) => {
    await page.goto("/stories");
    await expectNoHorizontalScroll(page);
  });

  test("a published story renders, passes axe and does not scroll sideways", async ({ page }, testInfo) => {
    const { published } = await postsByState();
    test.skip(published.length === 0, "no published story in content/blog yet");
    const errors = trackErrors(page);
    const response = await page.goto(`/stories/${published[0]}`);
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await attachScreenshot(page, testInfo, `${testInfo.project.name}-story`);
    await expectA11y(page);
    await expectNoHorizontalScroll(page);
    expect(errors, errors.join("\n")).toEqual([]);
  });

  test("a draft story 404s", async ({ request }) => {
    const { drafts } = await postsByState();
    test.skip(drafts.length === 0, "no draft post in content/blog to test against");
    const res = await request.get(`/stories/${drafts[0]}`);
    expect(res.status()).toBe(404);
  });
});

test.describe("/blog redirects", () => {
  test("/blog ends at /stories", async ({ page }) => {
    const response = await page.goto("/blog");
    expect(response?.status()).toBe(200);
    expect(new URL(response!.url()).pathname).toBe("/stories");
  });

  test("/blog/<slug> ends at /stories/<slug>, permanently", async ({ request }) => {
    // Any slug works: the redirect runs before the page, so even a 404 shows where it went.
    const first = await request.get("/blog/some-story", { maxRedirects: 0 });
    expect(first.status()).toBe(308);
    const res = await request.get("/blog/some-story");
    expect(new URL(res.url()).pathname).toBe("/stories/some-story");
  });
});
