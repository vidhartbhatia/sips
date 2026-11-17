import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Review photos: private bucket, served through signed URLs (lib/storage.ts).
      // `search` is left unset because the token is in the query string.
      {
        protocol: "https",
        hostname: "qsomdozgkfvuhesodwnm.supabase.co",
        pathname: "/storage/v1/object/sign/photos/**",
      },
      // Blog images: public bucket (scripts/upload-blog-images.mjs).
      {
        protocol: "https",
        hostname: "qsomdozgkfvuhesodwnm.supabase.co",
        pathname: "/storage/v1/object/public/blog/**",
      },
    ],
  },
  // P1-25: Match uploadPhotoAction's 10MB validation. Without this, Next.js
  // defaults to 1MB and rejects real mobile photos before the action's own
  // size check can produce a friendly error.
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  // P1-26: Static browser hardening headers. Per-request CSP is set in
  // proxy.ts (needs a nonce). HSTS preload is intentionally left out for now; preload
  // submission is a separate decision.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Prevents the site from being framed by other origins (clickjacking).
          // Reinforced by `frame-ancestors 'none'` in CSP for modern browsers.
          { key: "X-Frame-Options", value: "DENY" },
          // Sends only the origin (not full URL with path/query) on cross-site
          // requests. Keeps internal paths private from third parties.
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Denies access to privileged browser APIs the app does not use.
          // `capture="environment"` on file inputs is a native picker hint, not
          // the Camera API, so camera=() is safe.
          {
            key: "Permissions-Policy",
            value:
              "camera=(), geolocation=(), microphone=(), payment=(), usb=(), clipboard-read=(), clipboard-write=(), fullscreen=(), display-capture=(), accelerometer=(), gyroscope=(), magnetometer=()",
          },
          // Forces HTTPS for one year on this host and all subdomains.
          // `preload` deliberately omitted — submitting to the HSTS preload
          // list is a one-way commitment that needs its own decision.
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
