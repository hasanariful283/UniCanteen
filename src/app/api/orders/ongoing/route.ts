import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function GET(_req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const customer = await prisma.customer.findUnique({ where: { userId } });
    if (!customer) return NextResponse.json({ error: "Customer not found" }, { status: 404 });

    const orders = await prisma.order.findMany({
      where: {
        customerId: customer.userId,
        status: { in: ["PENDING", "ACCEPTED", "IN_PROGRESS", "DELIVERING"] },
      },
      orderBy: { createdAt: "desc" },
      include: {
        foodItems: {
          include: {
            food: true,
            canteen: true,
          },
        },
        deliveryMan: {
          include: {
            user: true,
          },
        },
      },
    });

    return NextResponse.json({ orders });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
