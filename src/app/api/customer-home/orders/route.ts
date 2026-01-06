// Customer order history API with status filtering
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const status = searchParams.get('status');

    // Build where clause
    const whereClause: any = {
      customerId: customer.userId
    };

    if (status && status !== 'ALL') {
      whereClause.status = status;
    }

    // Get orders for this customer
    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        foodItems: {
          include: {
            food: {
              select: {
                name: true,
                price: true,
                image: true
              }
            },
            canteen: {
              select: {
                name: true
              }
            }
          }
        },
        deliveryMan: {
          include: {
            user: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    });

    // Get total count for pagination
    const totalCount = await prisma.order.count({
      where: whereClause
    });

    // Calculate summary statistics
    const stats = {
      total: totalCount,
      pending: await prisma.order.count({
        where: { ...whereClause, status: 'PENDING' }
      }),
      accepted: await prisma.order.count({
        where: { ...whereClause, status: 'ACCEPTED' }
      }),
      inProgress: await prisma.order.count({
        where: { ...whereClause, status: 'IN_PROGRESS' }
      }),
      delivering: await prisma.order.count({
        where: { ...whereClause, status: 'DELIVERING' }
      }),
      delivered: await prisma.order.count({
        where: { ...whereClause, status: 'DELIVERED' }
      }),
      cancelled: await prisma.order.count({
        where: { ...whereClause, status: 'CANCELLED' }
      }),
    };

    return NextResponse.json({
      orders,
      stats,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      },
      success: true
    });

  } catch (error) {
    console.error("Error fetching customer orders:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}