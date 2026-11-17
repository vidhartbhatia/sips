import Image from "next/image";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { getAllPosts } from "@/lib/blog";

export const metadata = { title: "Blog" };

export default async function BlogPage() {
  const posts = await getAllPosts();

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-12">
        <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-espresso-muted">
          Stories
        </span>
        <h1 className="mt-2 font-heading text-5xl text-espresso">Blog</h1>
        <p className="mt-3 text-base text-espresso-muted">stories from the cafe trail</p>

        {posts.length === 0 ? (
          <div className="mt-16 text-center">
            <Image
              src="/illustrations/coffee-cup.svg"
              alt=""
              width={160}
              height={160}
              className="mx-auto mb-6 opacity-50"
            />
            <p className="font-heading text-2xl text-espresso-muted">No posts yet</p>
            <p className="mt-2 text-sm text-espresso-muted">Check back soon!</p>
          </div>
        ) : (
          <ul className="mt-12 divide-y divide-espresso/[0.08]">
            {posts.map((post) => (
              <li key={post.slug}>
                <Link href={`/blog/${post.slug}`} className="group block py-6">
                  <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-espresso-muted">
                    {post.date}
                    {post.author && ` · ${post.author}`}
                  </span>
                  <h2 className="mt-1 font-display text-3xl text-espresso group-hover:text-terracotta">
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
