"use client";

import { useState, Suspense } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const supabase = createClient();

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setLoading(false);
    if (!error) setSent(true);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-10 text-center">
          <Image
            src="/illustrations/coffee-cup.svg"
            alt=""
            width={48}
            height={48}
            className="mx-auto mb-3 opacity-50"
          />
          <h1 className="font-heading text-4xl text-espresso">Sips</h1>
          <p className="mt-1 font-display text-lg italic text-espresso-muted">
            welcome back to your cafe journal
          </p>
        </div>

        {/* Error messages */}
        {error === "not_allowed" && (
          <div className="mb-6 rounded-xl border border-terracotta/20 bg-terracotta/5 p-4 text-center text-sm text-terracotta">
            This account isn&apos;t on the invite list.
          </div>
        )}
        {error === "auth_failed" && (
          <div className="mb-6 rounded-xl border border-terracotta/20 bg-terracotta/5 p-4 text-center text-sm text-terracotta">
            Something went wrong. Please try again.
          </div>
        )}

        {sent ? (
          <div className="rounded-xl border border-sage/30 bg-sage/5 p-6 text-center">
            <p className="font-heading text-2xl text-espresso">Check your email</p>
            <p className="mt-2 text-sm text-espresso-muted">
              We sent a magic link to <strong>{email}</strong>
            </p>
          </div>
        ) : (
          <>
            {/* Magic link */}
            <form onSubmit={handleMagicLink}>
              <label className="mb-1 block font-mono text-[11px] uppercase tracking-[0.2em] text-espresso-muted">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                required
                className="w-full rounded-lg border border-espresso/[0.12] bg-cream px-3 py-2.5 text-espresso placeholder:text-espresso-muted/50 focus:border-terracotta focus:outline-none focus:ring-1 focus:ring-terracotta/30"
              />
              <button
                type="submit"
                disabled={loading}
                className="mt-3 w-full rounded-xl bg-terracotta px-4 py-3 text-sm text-cream transition-colors hover:bg-terracotta-dark disabled:opacity-50"
              >
                {loading ? "Sending..." : "Send magic link"}
              </button>
            </form>
          </>
        )}

        {/* Back to site */}
        <p className="mt-8 text-center text-xs text-espresso-muted">
          <a href="/" className="hover:text-terracotta">
            &larr; Back to Sips
          </a>
        </p>
      </div>
    </div>
  );
}
