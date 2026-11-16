import { defineConfig, mergeConfig } from "vitest/config"
import base from "./vitest.config"
export default mergeConfig(
  base,
  defineConfig({
    resolve: { alias: { "@prisma/client/edge": new URL("./node_modules/@prisma/client/default.js", import.meta.url).pathname } },
  test: {
      include: ["scripts/d1.integration.ts"],
      testTimeout: 30000,
      hookTimeout: 30000,
    },
  }),
)
