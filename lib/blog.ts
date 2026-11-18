import "server-only";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { compileMDX } from "next-mdx-remote/rsc";
import type { ReactElement } from "react";
import type { MDXComponents } from "mdx/types";

const BLOG_DIR = path.join(process.cwd(), "content", "blog");
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export interface PostMeta {
  slug: string;
  title: string;
  date: string;
  author?: string;
  excerpt?: string;
  cover?: string;
}

export interface Post {
  meta: PostMeta;
  content: ReactElement;
}

const optionalString = (v: unknown): string | undefined =>
  typeof v === "string" && v.trim() !== "" ? v : undefined;

/**
 * Single source of truth for frontmatter → PostMeta. Returns null for drafts and for
 * invalid posts. Anything other than literal YAML `draft: false` (or no `draft` key)
 * counts as a draft, so a typo never publishes by accident.
 */
function toMeta(slug: string, fm: Record<string, unknown>): PostMeta | null {
  if ("draft" in fm && fm.draft !== false) return null;
  const title = optionalString(fm.title);
  const rawDate = fm.date instanceof Date ? fm.date.toISOString().slice(0, 10) : fm.date;
  const date = optionalString(rawDate);
  if (!title || !date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  return {
    slug,
    title,
    date,
    author: optionalString(fm.author),
    excerpt: optionalString(fm.excerpt),
    cover: optionalString(fm.cover),
  };
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
