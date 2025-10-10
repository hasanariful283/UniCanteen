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

    // Get orders currently being delivered by this person
    const deliveringOrders = await prisma.order.findMany({
      where: {
        assignedTo: userId,
        status: "DELIVERING",
      },
      orderBy: { updatedAt: "desc" },
      include: {
        customer: { 
          include: { 
            user: { select: { name: true, phone: true } }
          }
        },
        foodItems: {
          include: {
            food: { select: { name: true, price: true } },
            canteen: { select: { name: true, id: true } },
          },
        },
      },
    });

    return NextResponse.json({ orders: deliveringOrders });
  } catch (error) {
    console.error("Error fetching delivering orders:", error);
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

    const { orderId, status, location } = await request.json();

    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
    }

    // Verify this delivery person is assigned to this order
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        assignedTo: userId,
        status: "DELIVERING",
      },
      include: {
        customer: { include: { user: true } },
        foodItems: { include: { canteen: true } },
      },
    });

    if (!order) {
      return NextResponse.json({ 
        error: "Order not found or not in delivering status" 
      }, { status: 404 });
    }

    let updateData: any = {};

    // Handle status change to DELIVERED
    if (status === "DELIVERED") {
      updateData = {
        status: "DELIVERED",
        deliveryAt: new Date(),
      };

      // Create notification for customer
      await prisma.notification.create({
        data: {
          recipientId: order.customerId,
          senderId: userId,
          orderId: orderId,
          type: "ORDER_UPDATE",
          title: "Order Delivered Successfully",
          content: `Your order has been delivered successfully. Thank you for choosing our service!`,
        },
      });

      // Create notification for canteen owners (get from food items)
      const canteenIds = [...new Set(order.foodItems?.map(item => item.canteenId) || [])];
      for (const canteenId of canteenIds) {
        const canteen = await prisma.canteen.findUnique({
          where: { id: canteenId },
          select: { ownerId: true }
        });
        
        if (canteen?.ownerId) {
          await prisma.notification.create({
            data: {
              recipientId: canteen.ownerId,
              senderId: userId,
              orderId: orderId,
              type: "ORDER_UPDATE", 
              title: "Order Completed",
              content: `Order #${order.id.slice(-8)} has been delivered successfully.`,
            },
          });
        }
      }
    }

    // Update location tracking (if provided)
    if (location && location.latitude && location.longitude) {
      // In a real app, you'd store delivery tracking data
      // For now, we'll just log it
      console.log(`Delivery person ${userId} location update:`, location);
    }

    // Update the order
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: updateData,
      include: {
        customer: { 
          include: { 
            user: { select: { name: true, phone: true } }
          }
        },
        foodItems: {
          include: {
            food: { select: { name: true, price: true } },
            canteen: { select: { name: true } },
          },
        },
      },
    });

    return NextResponse.json({ 
      success: true, 
      order: updatedOrder,
      message: status === "DELIVERED" ? "Order marked as delivered successfully!" : "Order updated successfully!"
    });

  } catch (error) {
    console.error("Error updating delivering order:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}