import { siteImage } from "@/lib/og";

export const alt = "Sips, a Seattle cafe journal: a watercolour cafe scene";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** The site's default share image. No data, so it is drawn once at build time. */
export default async function Image(): Promise<Response> {
  return siteImage();
}
