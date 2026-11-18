import "server-only";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { compileMDX } from "next-mdx-remote/rsc";
import type { ReactElement } from "react";
import type { MDXComponents } from "mdx/types";
import { SLUG_RE, toMeta, type PostMeta } from "@/lib/blog-meta";

const BLOG_DIR = path.join(process.cwd(), "content", "blog");

export type { PostMeta } from "@/lib/blog-meta";

export interface Post {
  meta: PostMeta;
  content: ReactElement;
}

async function readSource(slug: string): Promise<string | null> {
  if (!SLUG_RE.test(slug)) return null;
  try {
    return await readFile(path.join(BLOG_DIR, `${slug}.mdx`), "utf8");
  } catch {
    return null;
  }
}

export async function getPost(
  slug: string,
  components: MDXComponents = {},
): Promise<Post | null> {
  const source = await readSource(slug);
  if (!source) return null;
  const { content, frontmatter } = await compileMDX<Record<string, unknown>>({
    source,
    components,
    options: { parseFrontmatter: true },
  });
  const meta = toMeta(slug, frontmatter);
  return meta ? { meta, content } : null;
}

// The leading `---` block, including its closing fence.
const FRONTMATTER_RE = /^---\r?\n[\s\S]*?\r?\n---[ \t]*(?:\r?\n|$)/;

/**
 * A post's metadata from its frontmatter alone. The body is never compiled, so a half-written
 * draft can't break the listing, or the root layout, which reads this on every page. The same
 * parser as getPost (compileMDX's parseFrontmatter) runs on the frontmatter block only.
 */
async function readMeta(slug: string): Promise<PostMeta | null> {
  const source = await readSource(slug);
  if (!source) return null;
  try {
    const { frontmatter } = await compileMDX<Record<string, unknown>>({
      source: source.match(FRONTMATTER_RE)?.[0] ?? "",
      options: { parseFrontmatter: true },
    });
    return toMeta(slug, frontmatter);
  } catch (error) {
    console.error(`content/blog/${slug}.mdx: unreadable frontmatter, skipped`, error);
    return null;
  }
}

export async function getAllPosts(): Promise<PostMeta[]> {
  let files: string[];
  try {
    files = await readdir(BLOG_DIR);
  } catch {
    return [];
  }
  const posts = await Promise.all(
    files.filter((f) => f.endsWith(".mdx")).map((file) => readMeta(file.replace(/\.mdx$/, ""))),
  );
  return posts
    .filter((p): p is PostMeta => p !== null)
    .sort((a, b) => b.date.localeCompare(a.date));
}

/** "2026-11-16" → "November 16, 2026", the same in every timezone. */
export function formatStoryDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  if (!year || !month || !day) return isoDate;
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString("en-US", {
    timeZone: "UTC",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

let publishedStories: Promise<PostMeta[]> | null = null;

/**
 * Published stories, newest first. The root layout calls this on every request (the nav shows
 * Stories only once one exists), so production memoizes it per server process: deployed files
 * never change. Dev reads the folder each time, so a new post shows up without a restart.
 */
export function listPublishedStories(): Promise<PostMeta[]> {
  if (process.env.NODE_ENV !== "production") return getAllPosts();
  publishedStories ??= getAllPosts().catch((error: unknown) => {
    publishedStories = null;
    throw error;
  });
  return publishedStories;
}

/** Published stories whose `cafes:` frontmatter lists this cafe, newest first. Feeds "Featured in". */
export async function getStoriesForCafe(slug: string): Promise<{ slug: string; title: string }[]> {
  const stories = await listPublishedStories();
  return stories.filter((s) => s.cafes.includes(slug)).map((s) => ({ slug: s.slug, title: s.title }));
}
