import type { MetadataRoute } from "next";
import { listPublishedStories } from "@/lib/blog";
import { buildSitemap } from "@/lib/seo";
import { getSitemapCafes } from "@/lib/supabase/queries";

// Read per request: the cafe list lives in the database, and the build has no database.
export const dynamic = "force-dynamic";

/** Public pages only: listed cafes (anon read of `listed_cafes`) and published stories. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [cafes, stories] = await Promise.all([getSitemapCafes(), listPublishedStories()]);
  return buildSitemap({ cafes, stories });
}
