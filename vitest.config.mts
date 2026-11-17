import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": import.meta.dirname },
  },
  test: {
    include: ["tests/**/*.test.ts"],
    exclude: ["node_modules/**", "e2e/**", ".claude/**", ".superpowers/**"],
    environment: "node",
    // PGlite boots a WASM Postgres per test file; give migrations room on slow CI runners.
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
});
