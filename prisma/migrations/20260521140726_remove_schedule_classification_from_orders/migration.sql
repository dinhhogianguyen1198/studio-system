/*
  Warnings:

  - You are about to drop the column `category` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `channel` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `deliveryDate` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `editedPhotoSentDate` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `orderManagementUnitId` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `rawPhotoSentDate` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `selectionDate` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `shootingDate` on the `orders` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_orderManagementUnitId_fkey";

-- DropIndex
DROP INDEX "orders_orderManagementUnitId_idx";

-- DropIndex
DROP INDEX "orders_shootingDate_idx";

-- AlterTable
ALTER TABLE "orders" DROP COLUMN "category",
DROP COLUMN "channel",
DROP COLUMN "deliveryDate",
DROP COLUMN "editedPhotoSentDate",
DROP COLUMN "orderManagementUnitId",
DROP COLUMN "rawPhotoSentDate",
DROP COLUMN "selectionDate",
DROP COLUMN "shootingDate";
