-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "campaign" TEXT,
ADD COLUMN     "category" TEXT,
ADD COLUMN     "channel" TEXT,
ADD COLUMN     "deliveryDate" TIMESTAMP(3),
ADD COLUMN     "editedPhotoSentDate" TIMESTAMP(3),
ADD COLUMN     "rawPhotoSentDate" TIMESTAMP(3),
ADD COLUMN     "selectionDate" TIMESTAMP(3),
ADD COLUMN     "shootingDate" TIMESTAMP(3),
ADD COLUMN     "source" "CustomerSource";

-- CreateIndex
CREATE INDEX "orders_shootingDate_idx" ON "orders"("shootingDate");
