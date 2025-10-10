-- AlterTable
ALTER TABLE "public"."customer_reports" ADD COLUMN     "deliveryPersonId" TEXT;

-- AddForeignKey
ALTER TABLE "public"."customer_reports" ADD CONSTRAINT "customer_reports_deliveryPersonId_fkey" FOREIGN KEY ("deliveryPersonId") REFERENCES "public"."DeliveryPerson"("userId") ON DELETE SET NULL ON UPDATE CASCADE;
