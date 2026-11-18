import type { Metadata } from "next";
import { NOINDEX } from "@/lib/seo";

// Sign-in. The page is a client component, so its metadata lives here.
export const metadata: Metadata = { title: "Sign in", robots: NOINDEX };

interface LayoutProps {
  children: React.ReactNode;
}

export default function LoginLayout({ children }: LayoutProps) {
  return children;
}
