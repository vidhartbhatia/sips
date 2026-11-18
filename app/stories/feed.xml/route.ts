import { listPublishedStories } from "@/lib/blog";
import { buildStoriesFeed } from "@/lib/feed";

// Stories are files in the deploy, so the feed is built once at build time.
export const dynamic = "force-static";

export async function GET(): Promise<Response> {
  return new Response(buildStoriesFeed(await listPublishedStories()), {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
