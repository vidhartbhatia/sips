// design-rules: enforced
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Illustration } from "@/components/ui/Illustration";

interface NotFoundViewProps {
  title: string;
  body: string;
  href: string;
  linkLabel: string;
}

/** A 404 inside the normal site chrome: the sleeping-cat spot, a heading, one way out. */
export function NotFoundView({ title, body, href, linkLabel }: NotFoundViewProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-6 py-20 text-center">
        <Illustration slot="404" className="h-auto w-56 sm:w-72" />
        <h1 className="mt-8 font-heading text-5xl text-espresso">{title}</h1>
        <p className="mt-3 text-lg text-espresso-muted">{body}</p>
        <Link
          href={href}
          className="mt-8 inline-block rounded-xl bg-terracotta-dark px-7 py-3 font-medium text-cream transition-colors hover:bg-espresso focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-terracotta-dark"
        >
          {linkLabel}
        </Link>
      </main>
      <Footer />
    </div>
  );
}
