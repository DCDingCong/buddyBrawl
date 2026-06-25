import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node"
  },
  resolve: {
    alias: {
      "@buddy-brawl/shared": "../../packages/shared/src/index.ts"
    }
  }
});
