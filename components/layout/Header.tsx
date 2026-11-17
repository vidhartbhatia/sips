"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { signOutAction } from "@/lib/actions/auth";

// /map is kept as a route but unlinked until it becomes a "where we've been" tracker.
// /want-to-go is private (admin-only, proxy.ts).
const navLinks = [
  { href: "/cafes", label: "Cafes" },
  { href: "/about", label: "About" },
];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function handleSignOut() {
    await signOutAction();
    setIsLoggedIn(false);
    // Full reload on purpose: drops any client-cached authed RSC payloads after sign-out.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- hard navigation is intentional
    window.location.href = "/";
  }

  return (
    <header className="sticky top-0 z-50 border-b border-espresso/[0.06] bg-cream/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link href="/" className="group flex items-center gap-2.5">
          <Image
            src="/illustrations/coffee-cup.svg"
            alt=""
            width={28}
            height={28}
            className="opacity-60 transition-transform group-hover:rotate-[-8deg]"
          />
          <span className="font-heading text-3xl text-espresso">
            Sips
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-espresso-muted transition-colors hover:text-terracotta"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {isLoggedIn ? (
          <div className="hidden items-center gap-3 md:flex">
            <Link
              href="/admin"
              className="rounded-lg border border-espresso/[0.1] px-3 py-1.5 text-xs text-espresso-muted transition-colors hover:border-terracotta hover:text-terracotta"
            >
              Admin
            </Link>
            <button
              onClick={handleSignOut}
              className="text-xs text-espresso-muted transition-colors hover:text-terracotta"
            >
              Log out
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="hidden md:block ml-2 rounded-lg border border-espresso/[0.1] px-3 py-1.5 text-xs text-espresso-muted transition-colors hover:border-terracotta hover:text-terracotta"
          >
            Log in
          </Link>
        )}

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex flex-col gap-1.5 md:hidden"
          aria-label="Toggle menu"
        >
          <motion.span
            animate={mobileOpen ? { rotate: 45, y: 6 } : { rotate: 0, y: 0 }}
            className="block h-0.5 w-6 bg-espresso"
          />
          <motion.span
            animate={mobileOpen ? { opacity: 0 } : { opacity: 1 }}
            className="block h-0.5 w-6 bg-espresso"
          />
          <motion.span
            animate={mobileOpen ? { rotate: -45, y: -6 } : { rotate: 0, y: 0 }}
            className="block h-0.5 w-6 bg-espresso"
          />
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden border-t border-espresso/[0.08] bg-cream md:hidden"
          >
            <div className="flex flex-col gap-1 px-6 py-4">
              {navLinks.map((link, i) => (
                <motion.div
                  key={link.href}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="block py-2 text-lg text-espresso-muted transition-colors hover:text-terracotta"
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
              {isLoggedIn ? (
                <div className="mt-2 flex flex-col gap-2 border-t border-espresso/[0.08] pt-3">
                  <Link
                    href="/admin"
                    onClick={() => setMobileOpen(false)}
                    className="text-sm text-espresso-muted transition-colors hover:text-terracotta"
                  >
                    Admin
                  </Link>
                  <button
                    onClick={() => { handleSignOut(); setMobileOpen(false); }}
                    className="text-left text-sm text-espresso-muted transition-colors hover:text-terracotta"
                  >
                    Log out
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="mt-2 block border-t border-espresso/[0.08] pt-3 text-sm text-espresso-muted transition-colors hover:text-terracotta"
                >
                  Log in
                </Link>
              )}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
