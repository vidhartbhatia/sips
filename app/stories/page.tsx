// design-rules: enforced
import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Illustration } from "@/components/ui/Illustration";
import { formatStoryDate, listPublishedStories } from "@/lib/blog";

export const metadata: Metadata = { title: "Stories" };

export default async function StoriesPage() {
  const posts = await listPublishedStories();

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-12">
        <h1 className="font-heading text-5xl text-espresso">Stories</h1>
        <p className="mt-3 text-base text-espresso-muted">Notes from the cafe trail.</p>

        {posts.length === 0 ? (
          <div className="mt-16 text-center">
            <Illustration slot="empty" className="mx-auto mb-6 h-40 w-auto" />
            <p className="font-heading text-2xl text-espresso-muted">No stories yet.</p>
          </div>
        ) : (
          <ul className="mt-12 divide-y divide-espresso/[0.08]">
            {posts.map((post) => (
              <li key={post.slug}>
                <Link href={`/stories/${post.slug}`} className="group block py-6">
                  <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-espresso-muted">
                    <time dateTime={post.date}>{formatStoryDate(post.date)}</time>
                    {post.author && ` · ${post.author}`}
                  </span>
                  <h2 className="mt-1 font-heading text-4xl text-espresso transition-colors group-hover:text-terracotta-dark">
                    {post.title}
                  </h2>
                  {post.excerpt && (
                    <p className="mt-2 text-base text-espresso-muted">{post.excerpt}</p>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
      <Footer />
    </div>
  );
}
