import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-espresso/[0.08] bg-cream">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-8 md:grid-cols-3">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2">
              <Image
                src="/illustrations/coffee-cup.svg"
                alt=""
                width={22}
                height={22}
                className="opacity-50"
              />
              <h3 className="font-heading text-2xl text-espresso">Sips</h3>
            </div>
            <p className="mt-2 font-display text-lg italic text-espresso-muted">
              a seattle cafe journal
            </p>
            <p className="mt-4 text-sm text-espresso-muted">
              Two coffee lovers exploring Seattle, one cup at a time.
            </p>
          </div>

          {/* Nav */}
          <div>
            <h4 className="font-mono text-[11px] uppercase tracking-[0.2em] text-espresso-muted">
              Explore
            </h4>
            <nav className="mt-3 flex flex-col gap-2">
              {[
                { href: "/map", label: "Map" },
                { href: "/cafes", label: "Cafes" },
                { href: "/want-to-go", label: "Want to Go" },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-espresso-muted transition-colors hover:text-terracotta"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Info */}
          <div>
            <h4 className="font-mono text-[11px] uppercase tracking-[0.2em] text-espresso-muted">
              About
            </h4>
            <nav className="mt-3 flex flex-col gap-2">
              <Link
                href="/about"
                className="text-sm text-espresso-muted transition-colors hover:text-terracotta"
              >
                About Us
              </Link>
            </nav>
          </div>
        </div>

        <div className="mt-10 flex items-center justify-between border-t border-espresso/[0.08] pt-6">
          <p className="text-xs text-espresso-muted">
            &copy; {new Date().getFullYear()} Sips. Made with love in Seattle.
          </p>
          <p className="font-display text-sm italic text-espresso-muted">
            every now and then
          </p>
        </div>
      </div>
    </footer>
  );
}
