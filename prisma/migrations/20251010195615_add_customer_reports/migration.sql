-- CreateEnum
CREATE TYPE "public"."ReportType" AS ENUM ('FOOD_QUALITY', 'SERVICE', 'HYGIENE', 'DELIVERY', 'PRICING', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."ReportStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'RESOLVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "public"."ReportPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateTable
CREATE TABLE "public"."customer_reports" (
    "id" TEXT NOT NULL,
    "type" "public"."ReportType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "public"."ReportStatus" NOT NULL DEFAULT 'PENDING',
    "priority" "public"."ReportPriority" NOT NULL DEFAULT 'MEDIUM',
    "rating" INTEGER,
    "response" TEXT,
    "customerId" TEXT NOT NULL,
    "canteenId" TEXT NOT NULL,
    "orderId" TEXT,
    "foodItemId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_reports_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."customer_reports" ADD CONSTRAINT "customer_reports_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."Customer"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."customer_reports" ADD CONSTRAINT "customer_reports_canteenId_fkey" FOREIGN KEY ("canteenId") REFERENCES "public"."Canteen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."customer_reports" ADD CONSTRAINT "customer_reports_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."customer_reports" ADD CONSTRAINT "customer_reports_foodItemId_fkey" FOREIGN KEY ("foodItemId") REFERENCES "public"."OrderFoodItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
