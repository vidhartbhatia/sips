// The stories RSS feed (`/stories/feed.xml`). Plain module, unit-tested.

import { absoluteUrl, SITE_NAME } from "@/lib/seo";

interface FeedStory {
  slug: string;
  title: string;
  date: string;
  author?: string;
  excerpt?: string;
}

const XML_ESCAPES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" };

function xml(text: string): string {
  return text.replace(/[&<>"']/g, (c) => XML_ESCAPES[c]);
}

/** "2026-11-16" → "Mon, 16 Nov 2026 00:00:00 GMT" (RFC 822, as RSS 2.0 wants). */
function rfc822(isoDate: string): string {
  return new Date(`${isoDate}T00:00:00Z`).toUTCString();
}

/** RSS 2.0 for published stories, newest first (the order `listPublishedStories` returns). */
export function buildStoriesFeed(stories: readonly FeedStory[]): string {
  const self = absoluteUrl("/stories/feed.xml");
  const items = stories.map((s) => {
    const url = absoluteUrl(`/stories/${s.slug}`);
    return [
      "    <item>",
      `      <title>${xml(s.title)}</title>`,
      `      <link>${url}</link>`,
      `      <guid isPermaLink="true">${url}</guid>`,
      `      <pubDate>${rfc822(s.date)}</pubDate>`,
      ...(s.author ? [`      <dc:creator>${xml(s.author)}</dc:creator>`] : []),
      ...(s.excerpt ? [`      <description>${xml(s.excerpt)}</description>`] : []),
      "    </item>",
    ].join("\n");
  });

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">',
    "  <channel>",
    `    <title>${SITE_NAME} stories</title>`,
    `    <link>${absoluteUrl("/stories")}</link>`,
    "    <description>Notes from the cafe trail: stories from Sips, a Seattle cafe journal.</description>",
    "    <language>en-us</language>",
    `    <atom:link href="${self}" rel="self" type="application/rss+xml"/>`,
    ...(stories[0] ? [`    <lastBuildDate>${rfc822(stories[0].date)}</lastBuildDate>`] : []),
    ...items,
    "  </channel>",
    "</rss>",
    "",
  ].join("\n");
}
