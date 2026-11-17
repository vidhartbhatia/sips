import { createClient } from "@/lib/supabase/server";
import { isAllowedEmail } from "@/lib/auth";
import { safeNext } from "@/lib/auth-redirect";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // Sanitize `next` against open-redirect attacks. See lib/auth-redirect.ts.
  const target = safeNext(searchParams.get("next"), origin);

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Check allowlist after successful auth
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user?.email && isAllowedEmail(user.email)) {
        return NextResponse.redirect(new URL(target, origin));
      }

      // Not allowed — sign out and redirect with error
      await supabase.auth.signOut();
      return NextResponse.redirect(new URL("/login?error=not_allowed", origin));
    }
  }

  // Auth failed — redirect to login with error
  return NextResponse.redirect(new URL("/login?error=auth_failed", origin));
}
