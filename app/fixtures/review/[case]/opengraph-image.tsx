import { fixturesEnabled } from "@/lib/fixtures";
import { cafeCard, cafeImage, notFoundImage } from "@/lib/og";
import { loadFixture } from "../cases";

// Per request, so `fixturesEnabled()` is never baked in at build time.
export const dynamic = "force-dynamic";

export const alt = "A Sips cafe review card: the cafe's name, our verdict and our score";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

interface ImageProps {
  params: Promise<{ case: string }>;
}

/** The review fixtures' share image, drawn by the same code as a real cafe's (e2e/seo.spec.ts). */
export default async function Image({ params }: ImageProps): Promise<Response> {
  if (!fixturesEnabled()) return notFoundImage();
  const { case: name } = await params;
  const fixture = loadFixture(name);
  return fixture ? cafeImage(cafeCard(fixture.view)) : notFoundImage();
}
