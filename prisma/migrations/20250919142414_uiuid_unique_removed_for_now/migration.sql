/*
  Warnings:

  - A unique constraint covering the columns `[cartId,foodId]` on the table `CartItem` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "public"."CartItem" DROP CONSTRAINT "CartItem_cartId_fkey";

-- DropIndex
DROP INDEX "public"."Customer_uiuId_key";

-- CreateIndex
CREATE UNIQUE INDEX "CartItem_cartId_foodId_key" ON "public"."CartItem"("cartId", "foodId");

-- AddForeignKey
ALTER TABLE "public"."CartItem" ADD CONSTRAINT "CartItem_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "public"."Cart"("id") ON DELETE CASCADE ON UPDATE CASCADE;
