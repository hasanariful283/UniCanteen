import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(request.url);
    const period = url.searchParams.get('period') || 'month';

    // Get delivery person record
    const deliveryPerson = await prisma.deliveryPerson.findUnique({
      where: { userId },
    });
    
    if (!deliveryPerson) {
      return NextResponse.json({ error: "Not a delivery person" }, { status: 403 });
    }

    // Calculate date ranges
    const now = new Date();
    let startDate: Date;
    
    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'quarter':
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        break;
      default: // month
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // Get orders for the period
    const orders = await prisma.order.findMany({
      where: {
        assignedTo: userId,
        createdAt: { gte: startDate },
      },
      include: {
        customer: { include: { user: true } },
        foodItems: { include: { food: true } },
      },
    });

    const completedOrders = orders.filter(order => order.status === 'DELIVERED');
    const cancelledOrders = orders.filter(order => order.status === 'CANCELLED');

    // Calculate performance metrics
    const totalDeliveries = orders.length;
    const completedDeliveries = completedOrders.length;
    const cancelledDeliveries = cancelledOrders.length;
    
    // Mock delivery times (replace with actual data when available)
    const deliveryTimes = completedOrders.map(() => 20 + Math.random() * 25); // 20-45 minutes
    const averageDeliveryTime = deliveryTimes.length > 0 
      ? Math.round(deliveryTimes.reduce((sum, time) => sum + time, 0) / deliveryTimes.length)
      : 0;
    
    const onTimeDeliveries = deliveryTimes.filter(time => time <= 30).length;
    const onTimeDeliveryRate = completedDeliveries > 0 
      ? Math.round((onTimeDeliveries / completedDeliveries) * 100)
      : 0;

    // Mock customer satisfaction (replace with actual ratings)
    const customerSatisfaction = 4.2 + Math.random() * 0.6; // 4.2-4.8 range

    // Calculate earnings
    const calculateEarnings = (totalPrice: number) => {
      const baseFee = 20;
      const commission = totalPrice * 0.15;
      return baseFee + commission;
    };

    const totalEarnings = completedOrders.reduce((sum, order) => 
      sum + calculateEarnings(order.totalPrice), 0
    );
    const averageEarningsPerOrder = completedOrders.length > 0 
      ? totalEarnings / completedOrders.length 
      : 0;

    // Generate weekly trends
    const weekLabels = [];
    const weeklyDeliveries = [];
    const weeklyEarnings = [];
    const weeklyRatings = [];

    const weeksToShow = period === 'quarter' ? 12 : period === 'month' ? 4 : 7;
    
    for (let i = weeksToShow - 1; i >= 0; i--) {
      const weekStart = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
      const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      const weekOrders = completedOrders.filter(order => {
        const orderDate = new Date(order.deliveryAt || order.updatedAt);
        return orderDate >= weekStart && orderDate < weekEnd;
      });

      weekLabels.push(`W${i + 1}`);
      weeklyDeliveries.push(weekOrders.length);
      weeklyEarnings.push(
        Math.round(weekOrders.reduce((sum, order) => sum + calculateEarnings(order.totalPrice), 0))
      );
      weeklyRatings.push(4.0 + Math.random() * 1.0); // Mock ratings
    }

    // Best and worst earning days
    const dailyEarnings: { [key: string]: number } = {};
    completedOrders.forEach(order => {
      const day = (order.deliveryAt || order.updatedAt).toISOString().split('T')[0];
      dailyEarnings[day] = (dailyEarnings[day] || 0) + calculateEarnings(order.totalPrice);
    });

    const sortedDays = Object.entries(dailyEarnings).sort((a, b) => b[1] - a[1]);
    const bestDay = sortedDays.length > 0 
      ? { day: sortedDays[0][0], earnings: Math.round(sortedDays[0][1]) }
      : { day: 'N/A', earnings: 0 };
    const worstDay = sortedDays.length > 0 
      ? { day: sortedDays[sortedDays.length - 1][0], earnings: Math.round(sortedDays[sortedDays.length - 1][1]) }
      : { day: 'N/A', earnings: 0 };

    // Goals (mock data - replace with user-defined goals)
    const monthlyGoals = {
      deliveryTarget: 100,
      earningsTarget: 8000,
      ratingTarget: 4.5,
      currentProgress: {
        deliveries: completedDeliveries,
        earnings: Math.round(totalEarnings),
        rating: customerSatisfaction,
      },
    };

    // Generate insights
    const insights = [];
    
    if (onTimeDeliveryRate >= 90) {
      insights.push("Excellent on-time delivery performance! Keep maintaining this standard.");
    } else if (onTimeDeliveryRate < 70) {
      insights.push("Consider optimizing your routes to improve on-time delivery rate.");
    }

    if (customerSatisfaction >= 4.5) {
      insights.push("Outstanding customer satisfaction rating! Your service quality is exceptional.");
    } else if (customerSatisfaction < 4.0) {
      insights.push("Focus on improving customer experience to boost your ratings.");
    }

    if (completedDeliveries > 0) {
      const completionRate = (completedDeliveries / totalDeliveries) * 100;
      if (completionRate >= 95) {
        insights.push("Impressive order completion rate! You're very reliable.");
      } else if (completionRate < 85) {
        insights.push("Work on reducing cancellations to improve your completion rate.");
      }
    }

    const avgEarningsComparison = averageEarningsPerOrder;
    if (avgEarningsComparison > 80) {
      insights.push("Your earnings per delivery are above average. Great job!");
    } else if (avgEarningsComparison < 60) {
      insights.push("Consider taking orders during peak hours to increase earnings.");
    }

    const reportData = {
      performance: {
        totalDeliveries,
        completedDeliveries,
        cancelledDeliveries,
        averageDeliveryTime,
        onTimeDeliveryRate,
        customerSatisfaction,
      },
      earnings: {
        totalEarnings: Math.round(totalEarnings),
        averageEarningsPerOrder: Math.round(averageEarningsPerOrder),
        bestDay,
        worstDay,
      },
      trends: {
        weeklyDeliveries,
        weeklyEarnings,
        weeklyRatings,
        weekLabels,
      },
      goals: monthlyGoals,
      insights,
    };

    return NextResponse.json(reportData);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}