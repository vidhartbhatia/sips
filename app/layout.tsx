import type { Metadata } from "next";
import {
  Instrument_Serif,
  Plus_Jakarta_Sans,
  Caveat,
  IBM_Plex_Mono,
} from "next/font/google";
import { connection } from "next/server";
import { NavProvider } from "@/components/layout/NavContext";
import { listPublishedStories } from "@/lib/blog";
import { siteMetadata } from "@/lib/seo";
import "./globals.css";

const instrumentSerif = Instrument_Serif({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

const caveat = Caveat({
  variable: "--font-heading",
  subsets: ["latin"],
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = siteMetadata;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // proxy.ts sends a nonce-based CSP with 'strict-dynamic'. Next.js only stamps that
  // nonce onto its scripts when a page renders per request, so opt every route out of
  // static prerendering — otherwise the browser blocks hydration on static pages.
  await connection();
  const hasStories = (await listPublishedStories()).length > 0;
  return (
    <html lang="en">
      <body
        className={`${instrumentSerif.variable} ${plusJakarta.variable} ${caveat.variable} ${ibmPlexMono.variable} font-body antialiased`}

      >
        <NavProvider hasStories={hasStories}>{children}</NavProvider>
      </body>
    </html>
  );
}
