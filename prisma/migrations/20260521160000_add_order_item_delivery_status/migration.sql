-- CreateEnum
CREATE TYPE "OrderItemDeliveryStatus" AS ENUM ('PENDING', 'DELIVERED');

-- AlterTable
ALTER TABLE "order_items"
  ADD COLUMN "deliveryStatus" "OrderItemDeliveryStatus" NOT NULL DEFAULT 'PENDING',
  ADD COLUMN "fileDeliveredAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "order_items_deliveryStatus_idx" ON "order_items"("deliveryStatus");
