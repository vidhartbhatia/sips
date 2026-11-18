// design-rules: enforced
import type { Metadata } from "next";
import type { ComponentPropsWithoutRef } from "react";
import { notFound } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { formatStoryDate, getPost } from "@/lib/blog";
import { pageMetadata } from "@/lib/seo";

interface StoryPageProps {
  params: Promise<{ slug: string }>;
}

const mdxComponents = {
  h2: (props: ComponentPropsWithoutRef<"h2">) => (
    <h2 className="mt-12 font-display text-3xl text-espresso" {...props} />
  ),
  h3: (props: ComponentPropsWithoutRef<"h3">) => (
    <h3 className="mt-8 font-display text-2xl text-espresso" {...props} />
  ),
  p: (props: ComponentPropsWithoutRef<"p">) => (
    <p className="mt-5 text-lg leading-relaxed text-espresso" {...props} />
  ),
  a: (props: ComponentPropsWithoutRef<"a">) => (
    <a className="text-terracotta-dark underline underline-offset-4" {...props} />
  ),
  ul: (props: ComponentPropsWithoutRef<"ul">) => (
    <ul className="mt-5 list-disc space-y-2 pl-6 text-lg text-espresso" {...props} />
  ),
  ol: (props: ComponentPropsWithoutRef<"ol">) => (
    <ol className="mt-5 list-decimal space-y-2 pl-6 text-lg text-espresso" {...props} />
  ),
  blockquote: (props: ComponentPropsWithoutRef<"blockquote">) => (
    <blockquote
      className="mt-6 border-l-2 border-terracotta pl-5 font-display text-xl italic text-espresso-muted"
      {...props}
    />
  ),
  img: ({ alt, ...props }: ComponentPropsWithoutRef<"img">) => (
    // Story images are public URLs in the `blog` bucket; a plain img keeps authoring simple.
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt ?? ""} className="mt-8 w-full rounded-xl border border-espresso/[0.08]" {...props} />
  ),
};

export async function generateMetadata({ params }: StoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: "Story not found" };
  const { title, excerpt, date, author } = post.meta;
  return pageMetadata({
    title,
    description: excerpt,
    path: `/stories/${slug}`,
    article: { publishedTime: date, ...(author && { authors: [author] }) },
    ownImage: true,
  });
}

export default async function StoryPage({ params }: StoryPageProps) {
  const { slug } = await params;
  const post = await getPost(slug, mdxComponents);
  if (!post) notFound();
  const { content, meta: frontmatter } = post;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-12">
        <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-espresso-muted">
          <time dateTime={frontmatter.date}>{formatStoryDate(frontmatter.date)}</time>
        </span>
        <h1 className="mt-2 font-heading text-5xl text-espresso">{frontmatter.title}</h1>
        {frontmatter.author && (
          <p className="mt-2 font-heading text-xl text-espresso-muted">— {frontmatter.author}</p>
        )}
        <article className="mt-8">{content}</article>
      </main>
      <Footer />
    </div>
  );
}
