import { defineConfig, devices } from "@playwright/test";

const isCI = !!process.env.CI;

/**
 * Read-only checks against a production build (`npm run build` first).
 * localhost:3000 (not 127.0.0.1) because the Mapbox token is URL-restricted to it.
 *
 * Projects:
 * - `desktop` runs every spec.
 * - `mobile` (375×812) runs only the layout specs: review, home, stories, a11y, illustrations.
 *
 * No screenshot baselines are committed (no images in the repo, and macOS and Linux renders
 * differ). Layout specs assert structure and attach full-page screenshots for human review.
 */
export default defineConfig({
  testDir: "./e2e",
  // Signed-in flows run only against a local Supabase stack (playwright.signed-in.config.ts).
  testIgnore: "**/signed-in/**",
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  workers: isCI ? 2 : undefined,
  reporter: isCI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    {
      name: "mobile",
      // Explicit Chromium settings rather than an iPhone preset: those use WebKit, and CI
      // installs only Chromium.
      use: {
        browserName: "chromium",
        viewport: { width: 375, height: 812 },
        isMobile: true,
        hasTouch: true,
        deviceScaleFactor: 2,
      },
      testMatch: /(review|home|stories|a11y|illustrations)\.spec\.ts/,
    },
  ],
  webServer: {
    command: "npx next start -p 3000",
    url: "http://localhost:3000/about",
    // Never attach to some other server already on :3000 (a dev server, another checkout).
    reuseExistingServer: false,
    timeout: 60_000,
    // Merged over process.env, so the NEXT_PUBLIC_* values still reach the server.
    // Turns on the env-gated `/fixtures/...` routes (`fixturesEnabled()` in lib/fixtures.ts),
    // which never render on Vercel.
    env: { SIPS_FIXTURES: "1" },
  },
});
