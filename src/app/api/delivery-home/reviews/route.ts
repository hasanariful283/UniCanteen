import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(request.url);
    const filter = url.searchParams.get('filter') || 'all';
    const sortBy = url.searchParams.get('sortBy') || 'newest';

    // Get delivery person record
    const deliveryPerson = await prisma.deliveryPerson.findUnique({
      where: { userId },
    });
    
    if (!deliveryPerson) {
      return NextResponse.json({ error: "Not a delivery person" }, { status: 403 });
    }

    // Get all completed orders for this delivery person
    const completedOrders = await prisma.order.findMany({
      where: {
        assignedTo: userId,
        status: "DELIVERED",
      },
      include: {
        customer: { include: { user: true } },
        foodItems: {
          include: {
            food: true,
          },
        },
      },
    });

    // Generate mock reviews (replace with actual review system)
    const mockReviews = completedOrders.map((order, index) => {
      const rating = Math.floor(Math.random() * 2) + 4; // 4-5 stars mostly
      const deliveryTime = 20 + Math.floor(Math.random() * 25); // 20-45 minutes
      const comments = [
        "Fast delivery and food was still hot!",
        "Great service, very professional delivery person.",
        "On time delivery, thank you!",
        "Food arrived exactly as ordered.",
        "Could be faster but overall good service.",
        "Excellent delivery experience!",
        "Very polite and professional.",
        null, // Some reviews without comments
        null,
      ];
      
      return {
        id: `review_${order.id}`,
        rating,
        comment: comments[Math.floor(Math.random() * comments.length)],
        customerName: order.customer?.user?.name || "Anonymous Customer",
        orderDate: order.createdAt.toISOString(),
        orderId: order.id,
        orderTotal: order.totalPrice,
        deliveryTime,
        isPositive: rating >= 4,
        foodItems: order.foodItems.map(item => item.food.name),
      };
    });

    // Filter reviews by rating if specified
    let filteredReviews = mockReviews;
    if (filter !== 'all') {
      const filterRating = parseInt(filter);
      filteredReviews = mockReviews.filter(review => review.rating === filterRating);
    }

    // Sort reviews
    switch (sortBy) {
      case 'oldest':
        filteredReviews.sort((a, b) => new Date(a.orderDate).getTime() - new Date(b.orderDate).getTime());
        break;
      case 'highest':
        filteredReviews.sort((a, b) => b.rating - a.rating);
        break;
      case 'lowest':
        filteredReviews.sort((a, b) => a.rating - b.rating);
        break;
      default: // newest
        filteredReviews.sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());
    }

    // Calculate stats
    const totalReviews = mockReviews.length;
    const averageRating = totalReviews > 0 
      ? mockReviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews 
      : 0;

    const ratingDistribution = mockReviews.reduce((acc, review) => {
      acc[review.rating] = (acc[review.rating] || 0) + 1;
      return acc;
    }, {} as { [key: number]: number });

    const positiveReviews = mockReviews.filter(review => review.rating >= 4).length;
    const positivePercentage = totalReviews > 0 ? (positiveReviews / totalReviews) * 100 : 0;

    const reviewsWithComments = mockReviews.filter(review => review.comment).length;
    const responseRate = totalReviews > 0 ? (reviewsWithComments / totalReviews) * 100 : 0;

    // Mock recent trend calculation
    const recentReviews = mockReviews.slice(0, 5);
    const olderReviews = mockReviews.slice(5, 10);
    const recentAvg = recentReviews.length > 0 
      ? recentReviews.reduce((sum, r) => sum + r.rating, 0) / recentReviews.length 
      : 0;
    const olderAvg = olderReviews.length > 0 
      ? olderReviews.reduce((sum, r) => sum + r.rating, 0) / olderReviews.length 
      : 0;
    
    let recentTrend: 'up' | 'down' | 'stable' = 'stable';
    if (recentAvg > olderAvg + 0.2) recentTrend = 'up';
    else if (recentAvg < olderAvg - 0.2) recentTrend = 'down';

    const stats = {
      averageRating,
      totalReviews,
      ratingDistribution,
      recentTrend,
      positivePercentage,
      responseRate,
    };

    return NextResponse.json({ 
      reviews: filteredReviews,
      stats 
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}