// design-rules: enforced
"use client";

import Link from "next/link";
import { publicNav } from "@/lib/nav";
import { useHasStories } from "@/components/layout/NavContext";

/** The footer's copy of the public nav. Client-only because it reads the Stories flag. */
export default function FooterNav() {
  return (
    <nav aria-label="Footer" className="mt-3 flex flex-col gap-2">
      {publicNav(useHasStories()).map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="text-sm text-espresso-muted transition-colors hover:text-terracotta-dark"
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
