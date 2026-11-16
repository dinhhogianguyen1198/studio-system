import { defineConfig } from "vite";
import { cloudflare } from "@cloudflare/vite-plugin";

// OpenNext generates the Worker; Vite packages it into cf Build Output.
export default defineConfig({
  publicDir: ".open-next/assets",
  plugins: [cloudflare()],
  build: {
    rollupOptions: {
      output: {
        banner: 'import { createRequire as __createNodeRequire } from "node:module"; const require = __createNodeRequire("/bundle/index.js");',
      },
    },
    // OpenNext leaves Node built-in require() calls in its ESM bundles.
    commonjsOptions: {
      include: [/\.open-next\//, /node_modules/],
      extensions: [".js", ".mjs", ".cjs"],
      transformMixedEsModules: true,
    },
  },
});
