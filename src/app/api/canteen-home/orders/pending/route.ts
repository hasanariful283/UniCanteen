import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Find canteens owned by this user
    const canteens = await prisma.canteen.findMany({ where: { ownerId: userId }, select: { id: true } });
    const canteenIds = canteens.map(c => c.id);
    if (canteenIds.length === 0) return NextResponse.json({ orders: [] });

    // Orders that include items from these canteens and are active
    const orders = await prisma.order.findMany({
      where: {
        status: { in: ["PENDING", "ACCEPTED", "IN_PROGRESS", "DELIVERING"] },
        foodItems: { some: { canteenId: { in: canteenIds } } },
      },
      orderBy: { createdAt: "desc" },
      include: {
        customer: { include: { user: true } },
        deliveryMan: { include: { user: true } },
        foodItems: {
          where: { canteenId: { in: canteenIds } },
          include: { food: true, canteen: true },
        },
      },
    });

    return NextResponse.json({ orders });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
