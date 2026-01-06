// Customer voucher management and available discounts
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const { userId } = await auth();
        if (!userId)
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );

        // > 5, discount 10%
        // > 10, discount 20%
        const numOfOrder = await prisma.order.count({
            where: {
                customerId: userId,
                status: "PENDING", // Will be changed to DELIVERED in future
            },
        });

        console.log("Number of orders: ", numOfOrder);

        const existingVoucher = await prisma.voucher.findFirst({
            where: { customerId: userId },
            orderBy: { createdAt: "desc" }, // latest
        });

        if (existingVoucher) {
            return NextResponse.json({ numOfOrder, voucher: existingVoucher });
        }
        // 2) Decide voucher eligibility
        let discount = null;

        if (numOfOrder > 10) discount = 0.2; // 20%
        else if (numOfOrder > 5) discount = 0.1; // 10%

        if (!discount) {
            return NextResponse.json({ numOfOrder, voucher: null });
        }

        // 3) Create voucher if eligible
        const voucher = await prisma.voucher.create({
            data: {
                customerId: userId,
                discount,
                usageLimit: 1,
            },
        });

        return NextResponse.json({ numOfOrder, voucher });
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
        );
    }
}

/*
model Voucher {
  id          String   @id @default(cuid())
  customerId  String
  discount    Float
  usageLimit  Int?     // null = unlimited
  usedCount   Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  customer Customer @relation(fields: [customerId], references: [userId])
}
*/
