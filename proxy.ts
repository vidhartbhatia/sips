import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// P1-26: Derive the Supabase host from the env var so the project ref is
// never hardcoded into source. Computed once per cold start.
function getSupabaseHost(): string {
  try {
    const raw = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!raw) return "";
    return new URL(raw).origin;
  } catch {
    return "";
  }
}
const SUPABASE_ORIGIN = getSupabaseHost();

/**
 * Build the per-request Content-Security-Policy.
 *
 * Domains allowed:
 *  - Supabase project (Storage images, Auth/REST, Realtime WS) — derived from env
 *  - Mapbox (api.mapbox.com tiles/sprites/styles, events.mapbox.com telemetry)
 *  - Google Geocoding (maps.googleapis.com — server-side fetch only, listed for
 *    defense in depth in case it's ever called from the browser)
 *
 * Style: 'unsafe-inline' kept for v1. Tailwind v4 + Next.js inject inline
 * <style> blocks; removing it would require a non-trivial nonce wiring
 * through the streaming render. Revisit when we adopt next/script for
 * third-party JS later.
 *
 * Scripts: nonce-based with 'strict-dynamic'. In dev, also allow 'unsafe-eval'
 * for React Refresh / source maps.
 */
function buildCsp(nonce: string): string {
  const isDev = process.env.NODE_ENV !== "production";
  const supabaseHosts = [SUPABASE_ORIGIN, "https://*.supabase.co"]
    .filter(Boolean)
    .join(" ");

  const directives: Record<string, string> = {
    "default-src": "'self'",
    "base-uri": "'self'",
    "object-src": "'none'",
    "frame-ancestors": "'none'",
    "form-action": "'self'",
    "img-src": `'self' data: blob: ${supabaseHosts} https://api.mapbox.com https://*.mapbox.com`,
    "style-src": "'self' 'unsafe-inline'",
    "script-src": isDev
      ? `'self' 'nonce-${nonce}' 'strict-dynamic' 'unsafe-eval'`
      : `'self' 'nonce-${nonce}' 'strict-dynamic'`,
    "connect-src": `'self' ${supabaseHosts} wss://${SUPABASE_ORIGIN.replace(/^https?:\/\//, "")} https://api.mapbox.com https://events.mapbox.com https://maps.googleapis.com`,
    "worker-src": "'self' blob:",
    "child-src": "'self' blob:",
    "font-src": "'self' data:",
    "media-src": "'self' blob:",
  };

  if (!isDev) {
    directives["upgrade-insecure-requests"] = "";
  }

  return Object.entries(directives)
    .map(([k, v]) => (v ? `${k} ${v}` : k))
    .join("; ");
}

export async function proxy(request: NextRequest) {
  // P1-26: Generate a per-request nonce. Server components / future <Script>
  // tags can read it from the `x-nonce` request header.
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = buildCsp(nonce);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("content-security-policy", csp);

  let supabaseResponse = NextResponse.next({
    request: { headers: requestHeaders },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request: { headers: requestHeaders },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh the session (important for server components)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protect /admin routes
  if (request.nextUrl.pathname.startsWith("/admin")) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return applySecurityHeaders(NextResponse.redirect(url), csp);
    }

    // Check allowlist
    const allowed = (process.env.ALLOWED_EMAILS ?? "")
      .split(",")
      .map((e) => e.trim().toLowerCase());

    if (!user.email || !allowed.includes(user.email.toLowerCase())) {
      await supabase.auth.signOut();
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("error", "not_allowed");
      return applySecurityHeaders(NextResponse.redirect(url), csp);
    }
  }

  return applySecurityHeaders(supabaseResponse, csp);
}

function applySecurityHeaders(res: NextResponse, csp: string): NextResponse {
  res.headers.set("Content-Security-Policy", csp);
  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|illustrations/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
