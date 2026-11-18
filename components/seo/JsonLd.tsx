// design-rules: enforced
import { headers } from "next/headers";
import { serializeJsonLd } from "@/lib/seo";

interface JsonLdProps {
  data: Record<string, unknown>;
}

/**
 * Structured data for search engines. A JSON data block never runs, but it still carries the
 * request's CSP nonce (proxy.ts) so every <script> on the page has one (e2e/smoke.spec.ts).
 */
export async function JsonLd({ data }: JsonLdProps) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  return (
    <script type="application/ld+json" nonce={nonce} dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }} />
  );
}
