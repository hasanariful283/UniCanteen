/*
  Warnings:

  - You are about to drop the column `canteenId` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `foodItems` on the `Order` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Order" DROP CONSTRAINT "Order_canteenId_fkey";

-- AlterTable
ALTER TABLE "public"."Order" DROP COLUMN "canteenId",
DROP COLUMN "foodItems";

-- CreateTable
CREATE TABLE "public"."OrderFoodItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "foodId" TEXT NOT NULL,
    "canteenId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderFoodItem_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."OrderFoodItem" ADD CONSTRAINT "OrderFoodItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OrderFoodItem" ADD CONSTRAINT "OrderFoodItem_foodId_fkey" FOREIGN KEY ("foodId") REFERENCES "public"."CanteenFood"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OrderFoodItem" ADD CONSTRAINT "OrderFoodItem_canteenId_fkey" FOREIGN KEY ("canteenId") REFERENCES "public"."Canteen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
