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

    // Get recent ongoing orders assigned to this delivery person
    const ongoingOrders = await prisma.order.findMany({
      where: {
        assignedTo: userId,
        status: { in: ["ACCEPTED", "IN_PROGRESS"] },
      },
      orderBy: { updatedAt: "desc" },
      take: 10, // Limit to recent 10
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

    return NextResponse.json({ orders: ongoingOrders });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { orderId, status } = await request.json();

    if (!orderId || !status) {
      return NextResponse.json({ error: "Missing orderId or status" }, { status: 400 });
    }

    // Verify this delivery person is assigned to this order
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        assignedTo: userId,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found or not assigned to you" }, { status: 404 });
    }

    // Update order status
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { 
        status,
        ...(status === 'DELIVERED' && { deliveryAt: new Date() }),
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

    // Create notification for customer when status changes
    if (updatedOrder.customerId) {
      await prisma.notification.create({
        data: {
          recipientId: updatedOrder.customerId,
          senderId: userId,
          orderId: orderId,
          type: "ORDER_UPDATE",
          title: "Order Status Updated",
          content: `Your order status has been updated to ${status.toLowerCase().replace('_', ' ')}`,
        },
      });
    }

    return NextResponse.json({ success: true, order: updatedOrder });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}