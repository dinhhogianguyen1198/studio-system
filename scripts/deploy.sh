#!/usr/bin/env bash
# Deploy the current checkout to Cloudflare Workers. Database migrations are separate.
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."
node -e '
const fs = require("node:fs");
const config = JSON.parse(fs.readFileSync("wrangler.jsonc", "utf8"));
const binding = config.d1_databases.find((database) => database.binding === "DB");
if (!binding || binding.database_id === "00000000-0000-0000-0000-000000000000") {
  console.error("Cần Database ID D1 thật trong wrangler.jsonc trước khi deploy.");
  process.exit(1);
}
'
npm ci
npm run build:cloudflare
npm run deploy
