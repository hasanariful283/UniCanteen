"use server";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import DeliveryAssignmentService from "@/lib/delivery-assignment-service";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orderId } = await params;
    
    // Verify canteen owner
    const canteen = await prisma.canteen.findFirst({
      where: { ownerId: userId },
    });

    if (!canteen) {
      return NextResponse.json({ error: "Not a canteen owner" }, { status: 403 });
    }

    // Get the order
    const order = await prisma.order.findFirst({
      where: { 
        id: orderId,
        foodItems: {
          some: {
            canteenId: canteen.id
          }
        }
      },
      include: {
        foodItems: true
      }
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.status !== "PENDING") {
      return NextResponse.json({ error: "Order is not pending" }, { status: 400 });
    }

    // Update order status to ACCEPTED
    await prisma.order.update({
      where: { id: orderId },
      data: { status: "ACCEPTED" }
    });

    // Schedule automatic delivery assignment
    const assignmentService = DeliveryAssignmentService.getInstance();
    assignmentService.scheduleAutoAssignment(orderId, 2); // 2 minutes

    // Create notification for customer
    await prisma.notification.create({
      data: {
        recipientId: order.customerId,
        senderId: userId,
        title: 'Order Accepted',
        content: `Your order #${orderId.slice(-6)} has been accepted by ${canteen.name}. A delivery person will be assigned shortly.`,
        type: 'ORDER_UPDATE',
        orderId: orderId,
      }
    });

    return NextResponse.json({ 
      message: "Order accepted. Delivery person will be auto-assigned within 2 minutes.",
      orderId,
      scheduledAssignment: true
    });

  } catch (error) {
    console.error("Error accepting order:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}