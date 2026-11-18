// design-rules: enforced
import type { Metadata } from "next";
import { NotFoundView } from "@/components/ui/NotFoundView";

export const metadata: Metadata = { title: "Not found" };

export default function NotFound() {
  return (
    <NotFoundView title="Nothing brewing here." body="That page doesn't exist." href="/" linkLabel="Back home" />
  );
}
