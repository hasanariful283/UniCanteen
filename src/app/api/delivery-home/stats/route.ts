// Delivery person statistics and performance metrics dashboard
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Get delivery person record
    const deliveryPerson = await prisma.deliveryPerson.findUnique({
      where: { userId },
    });
    
    if (!deliveryPerson) {
      return NextResponse.json({ error: "Not a delivery person" }, { status: 403 });
    }

    // Get stats for this delivery person
    const [totalOrders, completedOrders, cancelledOrders] = await Promise.all([
      prisma.order.count({
        where: { assignedTo: userId },
      }),
      prisma.order.findMany({
        where: { 
          assignedTo: userId,
          status: "DELIVERED"
        },
        include: { foodItems: true },
      }),
      prisma.order.count({
        where: { 
          assignedTo: userId,
          status: "CANCELLED"
        },
      }),
    ]);

    // Calculate total collections and profit
    const totalCollections = completedOrders.reduce((sum, order) => sum + order.totalPrice, 0);
    // Assuming 10% commission for delivery person
    const totalProfit = totalCollections * 0.1;

    return NextResponse.json({
      totalOrders,
      totalCollections,
      totalProfit,
      cancelledOrders,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}