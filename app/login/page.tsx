"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Illustration } from "@/components/ui/Illustration";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}

const inputClass =
  "w-full rounded-lg border border-espresso/[0.12] bg-cream px-3 py-2.5 text-espresso placeholder:text-espresso-muted/50 focus:border-terracotta focus:outline-none focus:ring-1 focus:ring-terracotta/30";
const labelClass =
  "mb-1 block font-mono text-[11px] uppercase tracking-[0.2em] text-espresso-muted";
const primaryButtonClass =
  "mt-3 w-full rounded-xl bg-terracotta px-4 py-3 text-sm text-cream transition-colors hover:bg-terracotta-dark disabled:opacity-50";
const textButtonClass =
  "text-xs text-espresso-muted underline decoration-espresso/20 underline-offset-4 hover:text-terracotta";

function LoginContent() {
  const [email, setEmail] = useState("");
  // "code": the 6-digit fallback, for when the magic link opens in a different browser
  // (e.g. a mail app's in-app browser) and can't complete there.
  const [mode, setMode] = useState<"link" | "code">("link");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sendFailed, setSendFailed] = useState(false);
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [codeFailed, setCodeFailed] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const supabase = createClient();

  async function handleMagicLink(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setSendFailed(false);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        // Invite-only site: never create a new auth user from this form.
        // The real control is "Allow new users to sign up" off in Supabase Auth.
        shouldCreateUser: false,
      },
    });
    setLoading(false);
    if (error) {
      setSendFailed(true);
      return;
    }
    setSent(true);
    setMode("code");
  }

  async function handleCode(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setVerifying(true);
    setCodeFailed(false);
    const { error } = await supabase.auth.verifyOtp({ email, token: code, type: "email" });
    if (error) {
      setVerifying(false);
      setCodeFailed(true);
      return;
    }
    // The session cookie is set now; the server renders /admin with it.
    router.push("/admin");
  }

  function startOver() {
    setMode("link");
    setSent(false);
    setCode("");
    setCodeFailed(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-10 text-center">
          <Illustration slot="logo" className="mx-auto mb-3 h-12 w-auto" />
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

        {sendFailed && (
          <div className="mb-6 rounded-xl border border-terracotta/20 bg-terracotta/5 p-4 text-center text-sm text-terracotta">
            We couldn&apos;t send a link. Sips is invite-only, so check the
            address, or wait a minute and try again.
          </div>
        )}

        {mode === "code" ? (
          <>
            {sent && (
              <div className="mb-6 rounded-xl border border-sage/30 bg-sage/5 p-6 text-center">
                <p className="font-heading text-2xl text-espresso">Check your email</p>
                <p className="mt-2 text-sm text-espresso-muted">
                  We sent a magic link to <strong>{email}</strong>. On your
                  phone, enter the code from the email here instead of tapping
                  the link. Opening the link uses up the code.
                </p>
              </div>
            )}

            <form onSubmit={handleCode}>
              {!sent && (
                <div className="mb-4">
                  <label htmlFor="login-email" className={labelClass}>
                    Email
                  </label>
                  <input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@email.com"
                    required
                    className={inputClass}
                  />
                </div>
              )}
              <label htmlFor="login-code" className={labelClass}>
                Enter the 6-digit code
              </label>
              <input
                id="login-code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={code}
                // Digits only: codes pasted from an email can carry spaces.
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                minLength={6}
                maxLength={10}
                required
                aria-invalid={codeFailed}
                aria-describedby={codeFailed ? "login-code-error" : undefined}
                className={`${inputClass} text-center font-mono text-lg tracking-[0.3em]`}
              />
              <p
                id="login-code-error"
                role="alert"
                // Always rendered (empty until needed) so screen readers announce the message.
                className={`text-center text-sm text-terracotta ${codeFailed ? "mt-2" : ""}`}
              >
                {codeFailed ? "That code didn't work. Request a new link." : ""}
              </p>
              <button type="submit" disabled={verifying} className={primaryButtonClass}>
                {verifying ? "Checking..." : "Sign in with code"}
              </button>
            </form>

            <p className="mt-6 text-center">
              <button type="button" onClick={startOver} className={textButtonClass}>
                Send a new link
              </button>
            </p>
          </>
        ) : (
          <>
            {/* Magic link */}
            <form onSubmit={handleMagicLink}>
              <label htmlFor="login-email" className={labelClass}>
                Email
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                required
                className={inputClass}
              />
              <button type="submit" disabled={loading} className={primaryButtonClass}>
                {loading ? "Sending..." : "Send magic link"}
              </button>
            </form>

            <p className="mt-6 text-center">
              <button type="button" onClick={() => setMode("code")} className={textButtonClass}>
                Already have a code?
              </button>
            </p>
          </>
        )}

        {/* Back to site */}
        <p className="mt-8 text-center text-xs text-espresso-muted">
          <Link href="/" className="hover:text-terracotta">
            &larr; Back to Sips
          </Link>
        </p>
      </div>
    </div>
  );
}
