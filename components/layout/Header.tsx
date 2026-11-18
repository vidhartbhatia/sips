// design-rules: enforced
"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { signOutAction } from "@/lib/actions/auth";
import { publicNav } from "@/lib/nav";
import { useMotionSafe } from "@/lib/motion";
import { Illustration } from "@/components/ui/Illustration";
import { useHasStories } from "@/components/layout/NavContext";

const MOBILE_MENU_ID = "mobile-menu";

// The menu only mounts after a tap, so nothing here is hidden in the server HTML.
const menuFade = { closed: { opacity: 0 }, open: { opacity: 1 } };

export default function Header() {
  const navLinks = publicNav(useHasStories());
  const { safeTransition } = useMotionSafe();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Escape closes the menu and puts focus back on the toggle.
  useEffect(() => {
    if (!mobileOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setMobileOpen(false);
      toggleRef.current?.focus();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen]);

  const closeMenu = () => setMobileOpen(false);

  async function handleSignOut() {
    await signOutAction();
    setIsLoggedIn(false);
    // Full reload on purpose: drops any client-cached authed RSC payloads after sign-out.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- hard navigation is intentional
    window.location.href = "/";
  }

  const barTransition = safeTransition({ duration: 0.15 });

  return (
    <header className="sticky top-0 z-50 border-b border-espresso/[0.06] bg-cream/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link href="/" className="group flex items-center gap-2.5">
          <Illustration
            slot="logo"
            className="h-7 w-auto transition-transform group-hover:rotate-[-8deg]"
          />
          <span className="font-heading text-3xl text-espresso">
            Sips
          </span>
        </Link>

        {/* Desktop nav */}
        <nav aria-label="Main" className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-espresso-muted transition-colors hover:text-terracotta-dark"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {isLoggedIn ? (
          <div className="hidden items-center gap-3 md:flex">
            <Link
              href="/admin"
              className="rounded-lg border border-espresso/[0.1] px-3 py-1.5 text-xs text-espresso-muted transition-colors hover:border-terracotta-dark hover:text-terracotta-dark"
            >
              Admin
            </Link>
            <button
              onClick={handleSignOut}
              className="text-xs text-espresso-muted transition-colors hover:text-terracotta-dark"
            >
              Log out
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="hidden md:block ml-2 rounded-lg border border-espresso/[0.1] px-3 py-1.5 text-xs text-espresso-muted transition-colors hover:border-terracotta-dark hover:text-terracotta-dark"
          >
            Log in
          </Link>
        )}

        {/* Mobile menu toggle */}
        <button
          ref={toggleRef}
          type="button"
          onClick={() => setMobileOpen((open) => !open)}
          className="-mr-2 flex flex-col gap-1.5 p-2 md:hidden"
          aria-label="Menu"
          aria-expanded={mobileOpen}
          aria-controls={MOBILE_MENU_ID}
        >
          <motion.span
            animate={mobileOpen ? { rotate: 45, y: 6 } : { rotate: 0, y: 0 }}
            transition={barTransition}
            className="block h-0.5 w-6 bg-espresso"
          />
          <motion.span
            animate={mobileOpen ? { opacity: 0 } : { opacity: 1 }}
            transition={barTransition}
            className="block h-0.5 w-6 bg-espresso"
          />
          <motion.span
            animate={mobileOpen ? { rotate: -45, y: -6 } : { rotate: 0, y: 0 }}
            transition={barTransition}
            className="block h-0.5 w-6 bg-espresso"
          />
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.nav
            id={MOBILE_MENU_ID}
            aria-label="Main"
            variants={menuFade}
            initial="closed"
            animate="open"
            exit="closed"
            transition={safeTransition({ duration: 0.15, ease: "easeOut" })}
            className="border-t border-espresso/[0.08] bg-cream md:hidden"
          >
            <div className="flex flex-col gap-1 px-6 py-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={closeMenu}
                  className="block py-2 text-lg text-espresso-muted transition-colors hover:text-terracotta-dark"
                >
                  {link.label}
                </Link>
              ))}
              {isLoggedIn ? (
                <div className="mt-2 flex flex-col gap-2 border-t border-espresso/[0.08] pt-3">
                  <Link
                    href="/admin"
                    onClick={closeMenu}
                    className="text-sm text-espresso-muted transition-colors hover:text-terracotta-dark"
                  >
                    Admin
                  </Link>
                  <button
                    onClick={() => { handleSignOut(); closeMenu(); }}
                    className="text-left text-sm text-espresso-muted transition-colors hover:text-terracotta-dark"
                  >
                    Log out
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  onClick={closeMenu}
                  className="mt-2 block border-t border-espresso/[0.08] pt-3 text-sm text-espresso-muted transition-colors hover:text-terracotta-dark"
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
