#!/usr/bin/env bash
# =============================================================================
# deploy.sh — Auto build & deploy Studio System
#
# Cách dùng:
#   bash scripts/deploy.sh
# =============================================================================

set -euo pipefail

# ── Colors ───────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
RESET='\033[0m'

START_TIME=$(date +%s)

log()  { echo -e "${BOLD}[$(date +%H:%M:%S)]${RESET} $*"; }
ok()   { echo -e "${GREEN}  ✔${RESET} $*"; }
fail() { echo -e "${RED}  ✘ $*${RESET}"; exit 1; }

# ── Tìm app dir ──────────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR=""
SEARCH="$SCRIPT_DIR"
for _ in 1 2 3 4; do
  if [[ -f "$SEARCH/package.json" ]]; then
    APP_DIR="$(cd "$SEARCH" && pwd)"
    break
  fi
  SEARCH="$(dirname "$SEARCH")"
done
[[ -z "$APP_DIR" ]] && fail "Không tìm thấy package.json"

cd "$APP_DIR"

# ── Header ───────────────────────────────────────────────────────────────────
echo ""
echo -e "${CYAN}${BOLD}╔══════════════════════════════════════════╗${RESET}"
echo -e "${CYAN}${BOLD}║        Studio System — Deploy            ║${RESET}"
echo -e "${CYAN}${BOLD}╚══════════════════════════════════════════╝${RESET}"
echo -e "  Dir : ${CYAN}${APP_DIR}${RESET}"
echo -e "  Time: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

# ── Step 1: Git pull ──────────────────────────────────────────────────────────
log "1/7  Git pull..."
BEFORE=$(git rev-parse HEAD)
git pull
AFTER=$(git rev-parse HEAD)
if [[ "$BEFORE" == "$AFTER" ]]; then
  ok "Không có thay đổi mới ($(git rev-parse --short HEAD))"
else
  ok "Cập nhật: ${BEFORE:0:7} → ${AFTER:0:7}"
  git log --oneline "${BEFORE}..${AFTER}"
fi
echo ""

# ── Step 2: Clean .next ───────────────────────────────────────────────────────
log "2/7  Dọn build cũ..."
rm -rf .next
ok ".next đã xóa"
echo ""

# ── Step 3: npm install ───────────────────────────────────────────────────────
log "3/7  Cài packages..."
npm install --prefer-offline 2>&1 | tail -3
ok "npm install xong"
echo ""

# ── Step 4: Prisma generate ───────────────────────────────────────────────────
log "4/7  Prisma generate..."
npx prisma generate 2>&1 | grep -E "Generated|Error" || true
ok "Prisma client generated"
echo ""

# ── Step 5: Prisma migrate deploy ─────────────────────────────────────────────
log "5/7  Prisma migrate deploy..."
MIGRATE_OUT=$(npx prisma migrate deploy 2>&1)
echo "$MIGRATE_OUT" | grep -E "migration|pending|applied|No pending" || true
ok "Migrations applied"
echo ""

# ── Step 6: Build ─────────────────────────────────────────────────────────────
log "6/7  npm run build..."
npm run build
ok "Build thành công"
echo ""

# ── Step 7: Copy standalone assets ───────────────────────────────────────────
log "7/7  Copy assets & restart PM2..."
cp -r .next/static .next/standalone/.next/
cp -r public .next/standalone/
ok "Assets copied"

pm2 restart studio-app --update-env
ok "PM2 restarted"
echo ""

# ── Done ─────────────────────────────────────────────────────────────────────
END_TIME=$(date +%s)
ELAPSED=$((END_TIME - START_TIME))
MINUTES=$((ELAPSED / 60))
SECONDS=$((ELAPSED % 60))

echo -e "${GREEN}${BOLD}╔══════════════════════════════════════════╗${RESET}"
echo -e "${GREEN}${BOLD}║  Deploy hoàn tất ✔                       ║${RESET}"
echo -e "${GREEN}${BOLD}╚══════════════════════════════════════════╝${RESET}"
echo -e "  Thời gian: ${BOLD}${MINUTES}m ${SECONDS}s${RESET}"
echo -e "  Commit   : ${CYAN}$(git rev-parse --short HEAD)${RESET} — $(git log -1 --format='%s')"
echo ""
