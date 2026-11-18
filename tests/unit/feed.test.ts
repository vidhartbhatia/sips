import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { buildStoriesFeed } from "@/lib/feed";

vi.mock("server-only", () => ({}));
// The sitemap's cafe read is the database's job (listed_cafes, tests/db/gating.test.ts and the
// signed-in e2e); here it stands in, so the story side runs through the real blog code.
vi.mock("@/lib/supabase/queries", () => ({
  getSitemapCafes: async () => [{ slug: "larkspur", updated_at: "2026-11-10T00:00:00Z" }],
}));

describe("buildStoriesFeed", () => {
  const feed = buildStoriesFeed([
    { slug: "newer", title: "Rain & <matcha>", date: "2026-11-12", author: "Lea", excerpt: 'A "wet" day' },
    { slug: "older", title: "First sip", date: "2026-10-01" },
  ]);

  it("is RSS 2.0 with a self link and one item per story, newest first", () => {
    expect(feed).toMatch(/^<\?xml version="1.0" encoding="UTF-8"\?>\n<rss version="2.0"/);
    expect(feed).toContain('<atom:link href="https://oursips.com/stories/feed.xml" rel="self" type="application/rss+xml"/>');
    expect(feed.match(/<item>/g)).toHaveLength(2);
    expect(feed.indexOf("/stories/newer")).toBeLessThan(feed.indexOf("/stories/older"));
  });

  it("escapes text and dates items in RFC 822", () => {
    expect(feed).toContain("<title>Rain &amp; &lt;matcha&gt;</title>");
    expect(feed).toContain("<description>A &quot;wet&quot; day</description>");
    expect(feed).toContain("<pubDate>Thu, 12 Nov 2026 00:00:00 GMT</pubDate>");
    expect(feed).toContain("<dc:creator>Lea</dc:creator>");
    expect(feed).toContain('<guid isPermaLink="true">https://oursips.com/stories/older</guid>');
  });

  it("is still valid with no stories", () => {
    const empty = buildStoriesFeed([]);
    expect(empty).not.toContain("<item>");
    expect(empty).toContain("</channel>\n</rss>");
  });
});

describe("feed and sitemap routes read only published stories", () => {
  let root: string;

  beforeAll(async () => {
    root = await mkdtemp(path.join(tmpdir(), "sips-feed-"));
    const dir = path.join(root, "content", "blog");
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, "published.mdx"), '---\ntitle: "Published"\ndate: "2026-11-02"\n---\n\nHi.\n');
    await writeFile(path.join(dir, "draft.mdx"), '---\ntitle: "Draft"\ndate: "2026-11-03"\ndraft: true\n---\n\nHi.\n');
    vi.spyOn(process, "cwd").mockReturnValue(root);
  });

  afterAll(async () => {
    vi.restoreAllMocks();
    await rm(root, { recursive: true, force: true });
  });

  it("the feed lists the published story and not the draft", async () => {
    const { GET } = await import("@/app/stories/feed.xml/route");
    const res = await GET();
    expect(res.headers.get("content-type")).toBe("application/rss+xml; charset=utf-8");
    const body = await res.text();
    expect(body).toContain("/stories/published");
    expect(body).not.toContain("/stories/draft");
  });

  it("the sitemap lists listed cafes and published stories, never a draft", async () => {
    const { default: sitemap } = await import("@/app/sitemap");
    const urls = (await sitemap()).map((e) => e.url);
    expect(urls).toContain("https://oursips.com/cafes/larkspur");
    expect(urls).toContain("https://oursips.com/stories/published");
    expect(urls.some((u) => u.includes("draft"))).toBe(false);
    expect(urls.some((u) => /\/(admin|login|fixtures)/.test(u))).toBe(false);
  });
});
