-- AlterTable
ALTER TABLE "order_item_workers" ADD COLUMN "paidAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "order_item_workers_paidAt_idx" ON "order_item_workers"("paidAt");
