import { auth } from "@clerk/nextjs/server";
import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get customer record
    const customer = await prisma.customer.findUnique({
      where: { userId }
    });

    if (!customer) {
      return NextResponse.json({ error: "Customer profile not found" }, { status: 404 });
    }

    // Get all reports for this customer
    const reports = await prisma.customerReport.findMany({
      where: { customerId: customer.userId },
      include: {
        canteen: {
          select: {
            id: true,
            name: true,
            canteen_image: true
          }
        },
        order: {
          select: {
            id: true,
            totalPrice: true,
            createdAt: true
          }
        },
        foodItem: {
          select: {
            id: true,
            food: {
              select: {
                name: true
              }
            }
          }
        },
        deliveryPerson: {
          select: {
            userId: true,
            user: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Get statistics
    const stats = {
      total: reports.length,
      pending: reports.filter(r => r.status === 'PENDING').length,
      inProgress: reports.filter(r => r.status === 'IN_PROGRESS').length,
      resolved: reports.filter(r => r.status === 'RESOLVED').length,
      rejected: reports.filter(r => r.status === 'REJECTED').length,
    };

    return NextResponse.json({
      reports,
      stats,
      success: true
    });

  } catch (error) {
    console.error("Error fetching customer reports:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get customer record
    const customer = await prisma.customer.findUnique({
      where: { userId }
    });

    if (!customer) {
      return NextResponse.json({ error: "Customer profile not found" }, { status: 404 });
    }

    const body = await request.json();
    const {
      type,
      title,
      description,
      priority,
      canteenId,
      orderId,
      foodItemId,
      rating
    } = body;

    // Validation
    if (!type || !title || !canteenId) {
      return NextResponse.json(
        { error: "Type, title, and canteen are required" },
        { status: 400 }
      );
    }

    // Validate report type
    const validTypes = ['FOOD_QUALITY', 'SERVICE', 'HYGIENE', 'DELIVERY', 'PRICING', 'OTHER'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: "Invalid report type" },
        { status: 400 }
      );
    }

    // Validate priority
    const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
    if (!validPriorities.includes(priority)) {
      return NextResponse.json(
        { error: "Invalid priority level" },
        { status: 400 }
      );
    }

    // Validate canteen exists
    const canteen = await prisma.canteen.findUnique({
      where: { id: canteenId }
    });

    if (!canteen) {
      return NextResponse.json(
        { error: "Canteen not found" },
        { status: 404 }
      );
    }

    // Validate order if provided
    if (orderId) {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { foodItems: true }
      });

      if (!order || order.customerId !== customer.userId) {
        return NextResponse.json(
          { error: "Order not found or doesn't belong to you" },
          { status: 404 }
        );
      }
    }

    // Validate rating if provided
    if (rating !== undefined && (rating < 1 || rating > 5)) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    // Create the report
    const report = await prisma.customerReport.create({
      data: {
        type,
        title: title.trim(),
        description: description?.trim() || null,
        priority,
        rating: rating || null,
        customerId: customer.userId,
        canteenId: canteenId, // Use the canteen ID directly from the request
        orderId: orderId || null,
        foodItemId: foodItemId || null,
        // Note: deliveryPersonId can be added later if needed
      },
      include: {
        canteen: {
          select: {
            id: true,
            name: true,
            canteen_image: true
          }
        },
        order: {
          select: {
            id: true,
            totalPrice: true,
            createdAt: true
          }
        }
      }
    });

    // Create a notification for the canteen owner (optional)
    try {
      await prisma.notification.create({
        data: {
          type: 'REPORT_SUBMITTED',
          title: `New ${type.toLowerCase().replace('_', ' ')} report`,
          content: `A customer has submitted a ${type.toLowerCase().replace('_', ' ')} report: ${title}`,
          recipientId: canteen.ownerId,
          senderId: userId,
        }
      });
    } catch (notificationError) {
      console.error("Error creating notification:", notificationError);
      // Don't fail the request if notification creation fails
    }

    return NextResponse.json({
      message: "Report submitted successfully",
      report,
      success: true
    }, { status: 201 });

  } catch (error) {
    console.error("Error creating customer report:", error);
    
    // Handle specific Prisma errors
    if (error instanceof Error) {
      if (error.message.includes('Foreign key constraint')) {
        return NextResponse.json(
          { error: "Invalid reference data provided" },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}