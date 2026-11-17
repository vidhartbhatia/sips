import Image from "next/image";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import InkDivider from "@/components/ui/InkDivider";

export const metadata = { title: "About" };

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto max-w-3xl flex-1 px-6 py-12">
        <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-espresso-muted">
          Who we are
        </span>
        <h1 className="mt-2 font-heading text-5xl text-espresso">
          About Sips
        </h1>

        <InkDivider className="my-8 text-espresso" />

        <div className="space-y-6 text-lg leading-relaxed text-espresso-muted">
          <p>
            We&apos;re two coffee lovers based in Seattle, exploring the
            city&apos;s incredible cafe scene one cup at a time.
          </p>
          <p>
            Sips started as a way to remember the places we&apos;ve been and
            share our honest takes with friends. Every review is personal —
            we care about the coffee, sure, but also the vibe, the light,
            the people, and whether the pastries are worth it.
          </p>
          <p>
            This site is hand-drawn, lovingly coded, and perpetually
            caffeinated.
          </p>
        </div>

        <div className="mt-12 flex justify-center">
          <Image
            src="/illustrations/cat-with-cup.svg"
            alt="Cat with coffee cup"
            width={200}
            height={200}
            className="opacity-70"
          />
        </div>

        <InkDivider className="my-8 text-espresso" />
      </main>
      <Footer />
    </div>
  );
}
