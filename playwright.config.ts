import { defineConfig, devices } from "@playwright/test";

const isCI = !!process.env.CI;

/**
 * Smoke suite: read-only checks against a production build (`npm run build` first).
 * localhost:3000 (not 127.0.0.1) because the Mapbox token is URL-restricted to it.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  workers: isCI ? 2 : undefined,
  reporter: isCI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npx next start -p 3000",
    url: "http://localhost:3000/about",
    // Never attach to some other server already on :3000 (a dev server, another checkout).
    reuseExistingServer: false,
    timeout: 60_000,
  },
});
