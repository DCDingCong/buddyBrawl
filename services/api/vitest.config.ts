import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const currentDir = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    environment: "node"
  },
  resolve: {
    alias: {
      "@buddy-brawl/shared": resolve(currentDir, "../../packages/shared/src/index.ts"),
      "@buddy-brawl/configs": resolve(currentDir, "../../packages/configs/src/index.ts"),
      "@buddy-brawl/battle": resolve(currentDir, "../../packages/battle/src/index.ts")
    }
  }
});
