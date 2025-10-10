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

    // Get pending orders that are not assigned to anyone yet
    const upcomingOrders = await prisma.order.findMany({
      where: {
        status: "PENDING",
        assignedTo: null, // Not assigned to any delivery person yet
      },
      orderBy: { createdAt: "desc" },
      take: 20, // Limit to 20 available orders
      include: {
        customer: { include: { user: true } },
        foodItems: {
          include: {
            food: true,
            canteen: true,
          },
        },
      },
    });

    return NextResponse.json({ orders: upcomingOrders });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// POST endpoint to take an order (assign it to this delivery person)
export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { orderId } = await req.json();
    if (!orderId) return NextResponse.json({ error: "Order ID required" }, { status: 400 });

    // Get delivery person record
    const deliveryPerson = await prisma.deliveryPerson.findUnique({
      where: { userId },
    });
    
    if (!deliveryPerson) {
      return NextResponse.json({ error: "Not a delivery person" }, { status: 403 });
    }

    // Update the order to assign it to this delivery person and change status
    const updatedOrder = await prisma.order.update({
      where: { 
        id: orderId,
        status: "PENDING", // Only allow taking pending orders
        assignedTo: null, // Only if not already assigned
      },
      data: {
        assignedTo: userId,
        status: "ACCEPTED",
      },
      include: {
        customer: { include: { user: true } },
        foodItems: {
          include: {
            food: true,
            canteen: true,
          },
        },
      },
    });

    return NextResponse.json({ order: updatedOrder });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}