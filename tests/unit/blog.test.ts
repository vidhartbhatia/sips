import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

let root: string;
let blog: typeof import("@/lib/blog");

const post = (frontmatter: string, body = "Hello.") => `---\n${frontmatter}\n---\n\n${body}\n`;

beforeAll(async () => {
  root = await mkdtemp(path.join(tmpdir(), "sips-blog-"));
  const dir = path.join(root, "content", "blog");
  await mkdir(dir, { recursive: true });
  const files: Record<string, string> = {
    "older.mdx": post('title: "Older"\ndate: "2026-10-01"\nauthor: "Lea"'),
    "newer.mdx": post('title: "Newer"\ndate: "2026-11-02"\ndraft: false'),
    // A half-written draft: its body isn't valid MDX.
    "broken-draft.mdx": post('title: "WIP"\ndate: "2026-11-03"\ndraft: true', "Unfinished <Component"),
    // A published post with a broken body still lists; only its own page fails.
    "broken-body.mdx": post('title: "Broken body"\ndate: "2026-09-01"', "Oops <Component"),
    "quoted-false.mdx": post('title: "Quoted"\ndate: "2026-11-04"\ndraft: "false"'),
    "bad-yaml.mdx": post('title: "Bad\ndate: [2026'),
    "no-date.mdx": post('title: "No date"'),
    // "Featured in": stories that list a cafe in `cafes:`. Drafts never count.
    "elm-crawl.mdx": post('title: "Elm crawl"\ndate: "2026-08-01"\ncafes:\n  - elm-coffee\n  - larkspur'),
    "elm-again.mdx": post('title: "Elm again"\ndate: "2026-08-15"\ncafes: [elm-coffee]'),
    "elm-draft.mdx": post('title: "Elm draft"\ndate: "2026-08-20"\ndraft: true\ncafes: [elm-coffee]'),
  };
  for (const [name, source] of Object.entries(files)) await writeFile(path.join(dir, name), source);

  vi.spyOn(process, "cwd").mockReturnValue(root);
  blog = await import("@/lib/blog");
});

afterAll(async () => {
  vi.restoreAllMocks();
  await rm(root, { recursive: true, force: true });
});

describe("getAllPosts", () => {
  it("lists published posts newest first and survives broken drafts and bad YAML", async () => {
    const posts = await blog.getAllPosts();
    expect(posts.map((p) => p.slug)).toEqual(["newer", "older", "broken-body", "elm-again", "elm-crawl"]);
    expect(posts[1]).toMatchObject({ title: "Older", date: "2026-10-01", author: "Lea" });
  });

  it("listPublishedStories returns the same posts", async () => {
    expect((await blog.listPublishedStories()).map((p) => p.slug)).toEqual(["newer", "older", "broken-body", "elm-again", "elm-crawl"]);
  });
});

describe("getStoriesForCafe", () => {
  it("returns published stories that list the cafe, newest first, as slug and title", async () => {
    expect(await blog.getStoriesForCafe("elm-coffee")).toEqual([
      { slug: "elm-again", title: "Elm again" },
      { slug: "elm-crawl", title: "Elm crawl" },
    ]);
    expect(await blog.getStoriesForCafe("larkspur")).toEqual([{ slug: "elm-crawl", title: "Elm crawl" }]);
  });

  it("returns [] for a cafe no story mentions", async () => {
    expect(await blog.getStoriesForCafe("nowhere")).toEqual([]);
  });
});

describe("formatStoryDate", () => {
  it("formats the calendar date, never shifted by timezone", () => {
    expect(blog.formatStoryDate("2026-11-01")).toBe("November 1, 2026");
    expect(blog.formatStoryDate("not-a-date")).toBe("not-a-date");
  });
});
