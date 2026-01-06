import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  console.log("GET assign delivery route called");
  const { orderId } = await params;
  return NextResponse.json({ message: "Assign delivery route is accessible", orderId });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    console.log("🚀 Assign delivery API called");
    
    const { userId } = await auth();
    if (!userId) {
      console.log("❌ Unauthorized - no userId");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orderId } = await params;
    const body = await request.json();
    const { deliveryPersonId } = body;

    console.log("📦 Processing assignment:", { orderId, deliveryPersonId, userId });

    if (!deliveryPersonId) {
      console.log("❌ No delivery person ID provided");
      return NextResponse.json({ error: "Delivery person ID is required" }, { status: 400 });
    }

    // Get canteen info
    const canteen = await prisma.canteen.findFirst({
      where: { ownerId: userId },
    });

    if (!canteen) {
      console.log("❌ Canteen not found for user:", userId);
      return NextResponse.json({ error: "Canteen not found" }, { status: 404 });
    }

    console.log("✅ Found canteen:", canteen.id);

    // Find the order
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
        foodItems: {
          where: { canteenId: canteen.id },
          include: { food: true }
        }
      }
    });

    if (!order) {
      console.log("❌ Order not found:", orderId);
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    console.log("✅ Found order:", order.id, "status:", order.status);

    // Check if order status is DELIVERING
    if (order.status !== 'DELIVERING') {
      console.log("❌ Invalid order status:", order.status);
      return NextResponse.json({ 
        error: `Cannot assign delivery to order with status: ${order.status}. Order must be in DELIVERING status.` 
      }, { status: 400 });
    }

    // Verify delivery person exists
    const deliveryPerson = await prisma.deliveryPerson.findUnique({
      where: { userId: deliveryPersonId },
      include: {
        user: true
      }
    });

    if (!deliveryPerson) {
      console.log("❌ Delivery person not found:", deliveryPersonId);
      return NextResponse.json({ error: "Delivery person not found" }, { status: 404 });
    }

    console.log("✅ Found delivery person:", deliveryPerson.user.name);

    // Assign delivery person to the order
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { assignedTo: deliveryPersonId },
      include: {
        customer: {
          include: {
            user: true
          }
        },
        deliveryMan: {
          include: {
            user: true
          }
        },
        foodItems: {
          where: { canteenId: canteen.id },
          include: {
            food: true
          }
        }
      }
    });

    console.log("✅ Successfully assigned delivery person to order");

    // Create notification for delivery person
    try {
      await prisma.notification.create({
        data: {
          recipientId: deliveryPersonId,
          senderId: userId,
          title: 'New Delivery Assignment',
          content: `You have been assigned to deliver order #${orderId.slice(-6)} from ${canteen.name}`,
          type: 'ORDER_UPDATE',
          orderId: orderId,
        }
      });
      console.log("✅ Notification created for delivery person");
    } catch (notificationError) {
      console.log("⚠️ Failed to create notification:", notificationError);
      // Don't fail the whole operation if notification fails
    }

    return NextResponse.json({ 
      message: "Delivery person assigned successfully",
      order: updatedOrder 
    });

  } catch (error) {
    console.error("💥 Error in assign-delivery API:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}