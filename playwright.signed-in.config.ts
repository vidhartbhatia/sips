import { defineConfig, devices } from "@playwright/test";

// Signed-in flows against a LOCAL Supabase stack (`supabase start`) and a build that points at
// it. Never runs against production. See e2e/signed-in/.
export default defineConfig({
  testDir: "e2e/signed-in",
  timeout: 90_000,
  retries: 0,
  workers: 1,
  reporter: [["list"]],
  use: { baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3100", trace: "retain-on-failure" },
  projects: [{ name: "mobile", use: { ...devices["Pixel 7"] } }],
});
