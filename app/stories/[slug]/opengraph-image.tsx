import { formatStoryDate, listPublishedStories } from "@/lib/blog";
import { notFoundImage, storyImage } from "@/lib/og";

export const alt = "A Sips story card: the story's title, date and author";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

interface ImageProps {
  params: Promise<{ slug: string }>;
}

/** A story's share image. Drafts and unknown slugs get a 404. */
export default async function Image({ params }: ImageProps): Promise<Response> {
  const { slug } = await params;
  const story = (await listPublishedStories()).find((s) => s.slug === slug);
  if (!story) return notFoundImage();
  return storyImage({ ...story, date: formatStoryDate(story.date) });
}
