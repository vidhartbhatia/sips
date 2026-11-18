// design-rules: enforced
import { Illustration } from "@/components/ui/Illustration";
import FooterNav from "@/components/layout/FooterNav";

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-espresso/[0.08] bg-cream">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-8 md:grid-cols-3">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2">
              <Illustration slot="logo" className="h-[22px] w-auto" />
              <h3 className="font-heading text-2xl text-espresso">Sips</h3>
            </div>
            <p className="mt-2 font-display text-lg italic text-espresso-muted">
              a seattle cafe journal
            </p>
            <p className="mt-4 text-sm text-espresso-muted">
              Two friends, coffee and matcha, Seattle.
            </p>
          </div>

          {/* Nav */}
          <div>
            <h4 className="font-mono text-[11px] uppercase tracking-[0.2em] text-espresso-muted">
              Explore
            </h4>
            <FooterNav />
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
