-- AlterEnum: replace NEW/EDITING/DELIVERED with 6-state computed workflow
BEGIN;
CREATE TYPE "OrderStatus_new" AS ENUM ('NEW', 'WAITING_FILES', 'PARTIAL_DELIVERY', 'OVERDUE', 'FILES_DELIVERED', 'COMPLETED');
ALTER TABLE "public"."orders" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "orders" ALTER COLUMN "status" TYPE "OrderStatus_new" USING ('NEW'::"OrderStatus_new");
ALTER TYPE "OrderStatus" RENAME TO "OrderStatus_old";
ALTER TYPE "OrderStatus_new" RENAME TO "OrderStatus";
DROP TYPE "public"."OrderStatus_old";
ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT 'NEW';
COMMIT;

-- DropColumns: deadline, editingAt, deliveredAt (replaced by computed status)
DROP INDEX IF EXISTS "orders_deadline_idx";
ALTER TABLE "orders"
  DROP COLUMN IF EXISTS "deadline",
  DROP COLUMN IF EXISTS "editingAt",
  DROP COLUMN IF EXISTS "deliveredAt";
