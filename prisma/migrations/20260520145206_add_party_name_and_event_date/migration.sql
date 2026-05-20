-- AlterTable
ALTER TABLE "order_items" ADD COLUMN     "eventDate" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "partyName" TEXT;
