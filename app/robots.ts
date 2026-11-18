import type { MetadataRoute } from "next";
import { absoluteUrl, DISALLOWED } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: DISALLOWED },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
