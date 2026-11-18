import type { Metadata } from "next";
import { NOINDEX } from "@/lib/seo";

// The signed-in admin, draft previews included. Never indexed.
export const metadata: Metadata = { robots: NOINDEX };

interface LayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: LayoutProps) {
  return children;
}
