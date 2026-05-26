#!/usr/bin/env bash
# =============================================================================
# reset-orders-customers.sh
#
# Xóa toàn bộ Orders và Customers (kèm các bảng liên quan) trên production.
# Script sẽ:
#   1. Tạo pg_dump backup trước khi xóa
#   2. Hiển thị số lượng bản ghi sẽ bị ảnh hưởng
#   3. Yêu cầu gõ chính xác cụm xác nhận mới tiến hành
#
# Chạy từ thư mục gốc studio-system/:
#   bash scripts/reset-orders-customers.sh
# =============================================================================

set -euo pipefail

# ── Colors ───────────────────────────────────────────────────────────────────
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
BOLD='\033[1m'
RESET='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Tự detect app/ — hoạt động dù chạy từ scripts/ hay từ thư mục gốc
# Tìm app dir bằng cách đi lên từng cấp cho đến khi tìm thấy .env
APP_DIR=""
SEARCH="$SCRIPT_DIR"
for _ in 1 2 3 4; do
  if [[ -f "$SEARCH/.env" ]]; then
    APP_DIR="$(cd "$SEARCH" && pwd)"
    break
  fi
  SEARCH="$(dirname "$SEARCH")"
done

if [[ -z "$APP_DIR" ]]; then
  echo -e "${RED}Không tìm thấy .env — chạy script từ bên trong repo.${RESET}"
  exit 1
fi

# ── Load .env ─────────────────────────────────────────────────────────────────
ENV_FILE="$APP_DIR/.env"

# Parse DATABASE_URL từ .env
DATABASE_URL=$(grep -E '^DATABASE_URL=' "$ENV_FILE" | head -1 | cut -d'=' -f2- | tr -d '"' | tr -d "'")
if [[ -z "$DATABASE_URL" ]]; then
  echo -e "${RED}DATABASE_URL không tìm thấy trong .env${RESET}"
  exit 1
fi

# Tách thông tin kết nối từ postgresql://user:pass@host:port/dbname
DB_USER=$(echo "$DATABASE_URL" | sed -E 's|postgresql://([^:]+):.*|\1|')
DB_PASS=$(echo "$DATABASE_URL" | sed -E 's|postgresql://[^:]+:([^@]+)@.*|\1|')
DB_HOST=$(echo "$DATABASE_URL" | sed -E 's|postgresql://[^@]+@([^:/]+).*|\1|')
DB_PORT=$(echo "$DATABASE_URL" | sed -E 's|postgresql://[^@]+@[^:]+:([0-9]+)/.*|\1|')
DB_NAME=$(echo "$DATABASE_URL" | sed -E 's|postgresql://[^/]+/([^?]+).*|\1|')

export PGPASSWORD="$DB_PASS"

# ── Header ────────────────────────────────────────────────────────────────────
echo ""
echo -e "${RED}${BOLD}╔══════════════════════════════════════════════════════════════╗${RESET}"
echo -e "${RED}${BOLD}║         CẢNH BÁO: XÓA DỮ LIỆU PRODUCTION                   ║${RESET}"
echo -e "${RED}${BOLD}╚══════════════════════════════════════════════════════════════╝${RESET}"
echo ""
echo -e "  Database : ${CYAN}${DB_NAME}${RESET} @ ${CYAN}${DB_HOST}:${DB_PORT}${RESET}"
echo ""

# ── Step 1: Đếm bản ghi ──────────────────────────────────────────────────────
echo -e "${BOLD}Đang đếm bản ghi sẽ bị xóa...${RESET}"
echo ""

count_table() {
  psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM $1;" 2>/dev/null | tr -d ' '
}

ORDERS=$(count_table orders)
ORDER_ITEMS=$(count_table order_items)
ORDER_PAYMENTS=$(count_table order_payments)
ORDER_FEEDBACKS=$(count_table order_feedbacks)
ORDER_INCIDENTAL=$(count_table order_incidental_costs)
ORDER_WF_LOGS=$(count_table order_item_workflow_logs)
ORDER_WORKERS=$(count_table order_item_workers)
INVOICES=$(count_table invoices)
INVOICE_ITEMS=$(count_table invoice_items)
LEADS=$(count_table leads)
LEAD_NOTES=$(count_table lead_notes)
CUSTOMERS=$(count_table customers)
CUSTOMER_NOTES=$(count_table customer_notes)

echo -e "  Sẽ xóa hoàn toàn:"
echo -e "  ${RED}●${RESET} orders                    : ${BOLD}${ORDERS}${RESET}"
echo -e "  ${RED}●${RESET} order_items               : ${BOLD}${ORDER_ITEMS}${RESET} (cascade)"
echo -e "  ${RED}●${RESET} order_payments            : ${BOLD}${ORDER_PAYMENTS}${RESET} (cascade)"
echo -e "  ${RED}●${RESET} order_feedbacks           : ${BOLD}${ORDER_FEEDBACKS}${RESET} (cascade)"
echo -e "  ${RED}●${RESET} order_incidental_costs    : ${BOLD}${ORDER_INCIDENTAL}${RESET} (cascade)"
echo -e "  ${RED}●${RESET} order_item_workflow_logs  : ${BOLD}${ORDER_WF_LOGS}${RESET} (cascade)"
echo -e "  ${RED}●${RESET} order_item_workers        : ${BOLD}${ORDER_WORKERS}${RESET} (cascade)"
echo -e "  ${RED}●${RESET} invoices                  : ${BOLD}${INVOICES}${RESET}"
echo -e "  ${RED}●${RESET} invoice_items             : ${BOLD}${INVOICE_ITEMS}${RESET} (cascade)"
echo -e "  ${RED}●${RESET} leads                     : ${BOLD}${LEADS}${RESET}"
echo -e "  ${RED}●${RESET} lead_notes                : ${BOLD}${LEAD_NOTES}${RESET} (cascade)"
echo -e "  ${RED}●${RESET} customers                 : ${BOLD}${CUSTOMERS}${RESET}"
echo -e "  ${RED}●${RESET} customer_notes            : ${BOLD}${CUSTOMER_NOTES}${RESET} (cascade)"
echo ""
echo -e "  Sẽ giữ lại (chỉ set NULL field liên kết):"
echo -e "  ${YELLOW}○${RESET} expenses (orderId → NULL)"
echo ""

# ── Step 2: Backup ────────────────────────────────────────────────────────────
BACKUP_DIR="$SCRIPT_DIR/../backups"
mkdir -p "$BACKUP_DIR"
BACKUP_FILE="$BACKUP_DIR/pre-reset_$(date +%Y%m%d_%H%M%S).dump"

echo -e "${BOLD}Step 1/3: Tạo backup...${RESET}"
if pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
    --format=custom --compress=9 --file="$BACKUP_FILE" 2>/dev/null; then
  BACKUP_SIZE=$(du -sh "$BACKUP_FILE" | cut -f1)
  echo -e "  ${GREEN}✔${RESET} Backup saved: ${CYAN}${BACKUP_FILE}${RESET} (${BACKUP_SIZE})"
else
  echo -e "  ${YELLOW}⚠${RESET}  pg_dump thất bại — không tìm thấy pg_dump hoặc lỗi kết nối."
  echo -e "  ${YELLOW}⚠${RESET}  Bạn có muốn tiếp tục mà KHÔNG có backup? (yes/no)"
  read -r NO_BACKUP_CONFIRM
  if [[ "$NO_BACKUP_CONFIRM" != "yes" ]]; then
    echo "Hủy bỏ."
    exit 1
  fi
  BACKUP_FILE="(không có backup)"
fi
echo ""

# ── Step 3: Xác nhận ─────────────────────────────────────────────────────────
echo -e "${RED}${BOLD}Step 2/3: Xác nhận xóa dữ liệu${RESET}"
echo ""
echo -e "  Hành động này KHÔNG THỂ HOÀN TÁC."
echo -e "  Để xác nhận, hãy gõ chính xác cụm sau:"
echo ""
echo -e "      ${BOLD}XAC-NHAN-XOA${RESET}"
echo ""
printf "  > "
read -r CONFIRM

if [[ "$CONFIRM" != "XAC-NHAN-XOA" ]]; then
  echo ""
  echo -e "  ${YELLOW}Xác nhận không đúng. Hủy bỏ.${RESET}"
  exit 0
fi

echo ""

# ── Step 4: Chạy script xóa ───────────────────────────────────────────────────
echo -e "${BOLD}Step 3/3: Đang xóa dữ liệu...${RESET}"
echo ""

cd "$APP_DIR"
TS_SCRIPT="$SCRIPT_DIR/reset-orders-customers.ts"
if [[ ! -f "$TS_SCRIPT" ]]; then
  TS_SCRIPT="$SCRIPT_DIR/../scripts/reset-orders-customers.ts"
fi
npx tsx "$TS_SCRIPT"

echo ""
echo -e "${GREEN}${BOLD}Hoàn tất.${RESET}"
echo -e "  Backup tại: ${CYAN}${BACKUP_FILE}${RESET}"
echo ""
