import type { Metadata } from "next";
import {
  Instrument_Serif,
  Plus_Jakarta_Sans,
  Caveat,
  IBM_Plex_Mono,
} from "next/font/google";
import { connection } from "next/server";
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

export const metadata: Metadata = {
  metadataBase: new URL("https://oursips.com"),
  title: {
    default: "Sips — A Seattle Cafe Journal",
    template: "%s | Sips",
  },
  description:
    "Two coffee lovers exploring Seattle, one cup at a time. Reviews, ratings, and recommendations for the city's best cafes.",
  keywords: ["seattle", "cafes", "coffee", "reviews", "cafe guide"],
  openGraph: {
    title: "Sips — A Seattle Cafe Journal",
    description:
      "Two coffee lovers exploring Seattle, one cup at a time.",
    url: "https://oursips.com",
    siteName: "Sips",
    locale: "en_US",
    type: "website",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // proxy.ts sends a nonce-based CSP with 'strict-dynamic'. Next.js only stamps that
  // nonce onto its scripts when a page renders per request, so opt every route out of
  // static prerendering — otherwise the browser blocks hydration on static pages.
  await connection();
  return (
    <html lang="en">
      <body
        className={`${instrumentSerif.variable} ${plusJakarta.variable} ${caveat.variable} ${ibmPlexMono.variable} font-body antialiased`}

      >
        {children}
      </body>
    </html>
  );
}
