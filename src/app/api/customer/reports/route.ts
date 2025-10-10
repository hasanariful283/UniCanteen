import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

// API for customers to submit reports
export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { 
      type, 
      title, 
      description, 
      priority = 'MEDIUM', 
      rating,
      canteenId, 
      orderId,
      foodItemId 
    } = body;

    // Validate required fields
    if (!type || !title || !canteenId) {
      return NextResponse.json({ 
        error: "Missing required fields: type, title, canteenId" 
      }, { status: 400 });
    }

    // Verify the user is a customer
    const customer = await prisma.customer.findUnique({
      where: { userId }
    });

    if (!customer) {
      return NextResponse.json({ 
        error: "Customer profile not found" 
      }, { status: 404 });
    }

    // Verify canteen exists
    const canteen = await prisma.canteen.findUnique({
      where: { id: canteenId }
    });

    if (!canteen) {
      return NextResponse.json({ 
        error: "Canteen not found" 
      }, { status: 404 });
    }

    // If orderId is provided, verify it belongs to this customer
    if (orderId) {
      const order = await prisma.order.findFirst({
        where: {
          id: orderId,
          customerId: userId
        }
      });

      if (!order) {
        return NextResponse.json({ 
          error: "Order not found or unauthorized" 
        }, { status: 404 });
      }
    }

    // Create the report
    const report = await prisma.customerReport.create({
      data: {
        type,
        title,
        description,
        priority,
        rating,
        customerId: userId,
        canteenId,
        orderId,
        foodItemId
      },
      include: {
        canteen: {
          select: {
            name: true
          }
        },
        order: {
          select: {
            id: true,
            createdAt: true
          }
        },
        foodItem: {
          include: {
            food: {
              select: {
                name: true
              }
            }
          }
        }
      }
    });

    // Create notification for canteen owner
    try {
      await prisma.notification.create({
        data: {
          recipientId: canteen.ownerId,
          senderId: userId,
          title: 'New Customer Report',
          content: `New ${type.toLowerCase().replace('_', ' ')} report: ${title}`,
          type: 'REPORT_SUBMITTED'
        }
      });
    } catch (notificationError) {
      console.log("Failed to create notification:", notificationError);
      // Don't fail the whole operation if notification fails
    }

    return NextResponse.json({ report }, { status: 201 });
  } catch (error) {
    console.error("Submit Report API Error:", error);
    return NextResponse.json({ error: "Failed to submit report" }, { status: 500 });
  }
}