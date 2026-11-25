import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

export default defineConfig({
  // Resolve the `@/…` path alias the app uses (mirrors tsconfig paths).
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    // Headroom for the cross-tenant integration tests, which hit a cloud DB
    // (Neon cold-start + network latency). Unit tests finish in milliseconds.
    testTimeout: 30000,
    hookTimeout: 30000,
  },
});
