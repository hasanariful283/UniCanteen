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
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get all completed deliveries for this delivery person
    const allDeliveries = await prisma.order.findMany({
      where: {
        assignedTo: userId,
        status: "DELIVERED",
      },
      select: {
        id: true,
        totalPrice: true,
        createdAt: true,
        deliveryAt: true,
      },
    });

    // Calculate earnings based on delivery fee structure
    const calculateEarnings = (totalPrice: number) => {
      // Assume delivery person gets 15% of order value + base fee of 20 taka
      const baseFee = 20;
      const commission = totalPrice * 0.15;
      return baseFee + commission;
    };

    // Filter deliveries by time periods
    const todayDeliveries = allDeliveries.filter(d => d.deliveryAt && new Date(d.deliveryAt) >= todayStart);
    const weekDeliveries = allDeliveries.filter(d => d.deliveryAt && new Date(d.deliveryAt) >= weekStart);
    const monthDeliveries = allDeliveries.filter(d => d.deliveryAt && new Date(d.deliveryAt) >= monthStart);

    // Calculate earnings for each period
    const todayEarnings = todayDeliveries.reduce((sum, order) => sum + calculateEarnings(order.totalPrice), 0);
    const weekEarnings = weekDeliveries.reduce((sum, order) => sum + calculateEarnings(order.totalPrice), 0);
    const monthEarnings = monthDeliveries.reduce((sum, order) => sum + calculateEarnings(order.totalPrice), 0);
    const totalEarnings = allDeliveries.reduce((sum, order) => sum + calculateEarnings(order.totalPrice), 0);

    // Generate daily earnings for the past 7 days
    const dailyEarnings = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
      
      const dayDeliveries = allDeliveries.filter(d => 
        d.deliveryAt && 
        new Date(d.deliveryAt) >= dayStart && 
        new Date(d.deliveryAt) < dayEnd
      );
      
      dailyEarnings.push({
        date: date.toISOString().split('T')[0],
        earnings: dayDeliveries.reduce((sum, order) => sum + calculateEarnings(order.totalPrice), 0),
        deliveries: dayDeliveries.length,
      });
    }

    // Mock payout history (replace with actual payout system)
    const payoutHistory = [
      {
        id: "payout_1",
        amount: totalEarnings * 0.8,
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: "completed" as const,
        method: "Bank Transfer",
      },
      {
        id: "payout_2",
        amount: totalEarnings * 0.2,
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        status: "pending" as const,
        method: "Mobile Banking",
      },
    ];

    // Calculate breakdown
    const deliveryFeeEarnings = allDeliveries.length * 20; // Base fee
    const commissionEarnings = totalEarnings - deliveryFeeEarnings;
    const tipsEarnings = allDeliveries.length * (Math.random() * 10 + 5); // Mock tips
    const bonusEarnings = Math.floor(allDeliveries.length / 10) * 100; // Bonus every 10 deliveries

    const earningsData = {
      totalEarnings,
      todayEarnings,
      weekEarnings,
      monthEarnings,
      deliveryFee: deliveryFeeEarnings,
      tips: tipsEarnings,
      bonus: bonusEarnings,
      totalDeliveries: allDeliveries.length,
      avgEarningsPerDelivery: allDeliveries.length > 0 ? totalEarnings / allDeliveries.length : 0,
      payoutHistory,
      dailyEarnings,
    };

    return NextResponse.json(earningsData);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}