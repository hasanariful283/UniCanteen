import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(request.url);
    const dateRange = url.searchParams.get('dateRange') || 'month';
    const minRating = parseInt(url.searchParams.get('minRating') || '0');
    const searchTerm = url.searchParams.get('searchTerm') || '';

    // Get delivery person record
    const deliveryPerson = await prisma.deliveryPerson.findUnique({
      where: { userId },
    });
    
    if (!deliveryPerson) {
      return NextResponse.json({ error: "Not a delivery person" }, { status: 403 });
    }

    // Calculate date range for filtering
    const now = new Date();
    let startDate: Date;
    
    switch (dateRange) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      default:
        startDate = new Date(0); // All time
    }

    // Build search conditions
    const whereClause: any = {
      assignedTo: userId,
      status: "DELIVERED",
      deliveryAt: { gte: startDate },
    };

    // Add search term filtering
    if (searchTerm) {
      whereClause.OR = [
        { id: { contains: searchTerm, mode: 'insensitive' } },
        { 
          customer: { 
            user: { 
              name: { contains: searchTerm, mode: 'insensitive' } 
            } 
          } 
        }
      ];
    }

    // Get completed orders
    const completedOrders = await prisma.order.findMany({
      where: whereClause,
      orderBy: { deliveryAt: "desc" },
      take: 50, // Limit results
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

    // Add mock ratings and feedback for display (until rating system is implemented)
    const ordersWithRatings = completedOrders.map(order => ({
      ...order,
      rating: Math.floor(Math.random() * 2) + 4, // Mock rating 4-5
      customerFeedback: Math.random() > 0.7 ? "Great delivery service!" : undefined
    }));

    // Filter by rating if specified
    const filteredOrders = minRating > 0 
      ? ordersWithRatings.filter(order => order.rating >= minRating)
      : ordersWithRatings;

    // Calculate stats
    const stats = {
      totalCompleted: filteredOrders.length,
      totalEarnings: filteredOrders.reduce((sum, order) => sum + order.totalPrice, 0),
      avgRating: filteredOrders.reduce((sum, order) => sum + order.rating, 0) / (filteredOrders.length || 1),
      completionRate: 95 + Math.random() * 5, // Mock completion rate
    };

    return NextResponse.json({ 
      orders: filteredOrders,
      stats 
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}