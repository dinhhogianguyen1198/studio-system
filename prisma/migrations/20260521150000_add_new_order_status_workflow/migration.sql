-- AlterEnum: replace DRAFT/CONFIRMED/IN_PROGRESS/COMPLETED/CANCELLED → NEW/EDITING/DELIVERED
-- Existing rows are migrated to 'NEW' via the USING clause
BEGIN;
CREATE TYPE "OrderStatus_new" AS ENUM ('NEW', 'EDITING', 'DELIVERED');
ALTER TABLE "public"."orders" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "orders" ALTER COLUMN "status" TYPE "OrderStatus_new" USING ('NEW'::"OrderStatus_new");
ALTER TYPE "OrderStatus" RENAME TO "OrderStatus_old";
ALTER TYPE "OrderStatus_new" RENAME TO "OrderStatus";
DROP TYPE "public"."OrderStatus_old";
ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT 'NEW';
COMMIT;

-- AlterTable: drop old timestamp columns, add new ones
ALTER TABLE "orders" DROP COLUMN "cancelledAt",
DROP COLUMN "completedAt",
DROP COLUMN "confirmedAt",
ADD COLUMN     "deadline" TIMESTAMP(3),
ADD COLUMN     "deliveredAt" TIMESTAMP(3),
ADD COLUMN     "editingAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "orders_deadline_idx" ON "orders"("deadline");
