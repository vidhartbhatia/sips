import type { Metadata } from "next";
import { NOINDEX } from "@/lib/seo";

// Env-gated test fixtures. Never indexed.
export const metadata: Metadata = { robots: NOINDEX };

interface LayoutProps {
  children: React.ReactNode;
}

export default function FixturesLayout({ children }: LayoutProps) {
  return children;
}
