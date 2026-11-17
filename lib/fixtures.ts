/**
 * Whether the env-gated fixture routes (`/fixtures/...`) may render. Never on Vercel,
 * whatever else is set. Fixture pages export `dynamic = "force-dynamic"` so this runs
 * per request and is never baked in at build time.
 */
export function fixturesEnabled(): boolean {
  return process.env.SIPS_FIXTURES === "1" && process.env.VERCEL !== "1";
}
