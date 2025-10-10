/*
  Warnings:

  - Added the required column `updatedAt` to the `DeliveryProfile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `DeliveryTimeSlot` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."DeliveryProfile" ADD COLUMN     "address" TEXT,
ADD COLUMN     "allowCustomerRatings" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "defaultEndTime" TEXT NOT NULL DEFAULT '22:00',
ADD COLUMN     "defaultStartTime" TEXT NOT NULL DEFAULT '09:00',
ADD COLUMN     "earningsNotifications" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "language" TEXT NOT NULL DEFAULT 'en',
ADD COLUMN     "messageNotifications" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "orderNotifications" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "promotionNotifications" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "showLocationWhenOnline" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "showPhoneToCustomers" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "soundEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "theme" TEXT NOT NULL DEFAULT 'light',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "vehicleType" TEXT;

-- AlterTable
ALTER TABLE "public"."DeliveryTimeSlot" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "startTime" SET DATA TYPE TEXT,
ALTER COLUMN "endTime" SET DATA TYPE TEXT;
