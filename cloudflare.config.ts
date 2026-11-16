import { bindings, defineConfig } from "cf/config";

export default defineConfig({
  accountId: "cc7ca3a1a92d1fe821d829e36eef8321",
  worker: {
    name: "studio-system",
    entrypoint: "./.open-next/worker.js",
    compatibilityDate: "2026-11-16",
    compatibilityFlags: ["nodejs_compat"],
    workersDev: true,
    assets: {
      htmlHandling: "none",
      notFoundHandling: "none",
    },
    env: {
      ASSETS: bindings.assets(),
      DATABASE_URL: bindings.secret(),
      AUTH_SECRET: bindings.secret(),
      AUTH_URL: bindings.text("https://studio-system.dinhhogianguyen1198.workers.dev"),
      AUTH_TRUST_HOST: bindings.text("true"),
    },
    observability: {
      enabled: true,
      logs: { enabled: true, invocationLogs: true },
      traces: { enabled: true },
    },
  },
});
