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

    const url = new URL(request.url);
    const days = parseInt(url.searchParams.get('days') || '7');

    // Get canteen info
    const canteen = await prisma.canteen.findFirst({
      where: { ownerId: userId },
    });

    if (!canteen) {
      return NextResponse.json({ error: "Canteen not found" }, { status: 404 });
    }

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    // Parallel queries for analytics data
    const [
      revenueData,
      previousRevenueData,
      totalOrders,
      previousOrders,
      totalCustomers,
      ordersByStatus,
      topItemsData,
      dailyRevenue,
      dailyOrders,
      hourlyOrders
    ] = await Promise.all([
      // Total revenue for the period - calculated using raw query
      prisma.$queryRaw<Array<{ total: number }>>`
        SELECT COALESCE(SUM(cf.price * ofi.quantity), 0) as total
        FROM "OrderFoodItem" ofi
        JOIN "CanteenFood" cf ON ofi.food_id = cf.id
        JOIN "Order" o ON ofi.order_id = o.id
        WHERE ofi.canteen_id = ${canteen.id}
          AND o.created_at >= ${startDate}
          AND o.created_at <= ${endDate}
          AND o.status = 'DELIVERED'
      `,

      // Previous period revenue for comparison
      prisma.$queryRaw<Array<{ total: number }>>`
        SELECT COALESCE(SUM(cf.price * ofi.quantity), 0) as total
        FROM "OrderFoodItem" ofi
        JOIN "CanteenFood" cf ON ofi.food_id = cf.id
        JOIN "Order" o ON ofi.order_id = o.id
        WHERE ofi.canteen_id = ${canteen.id}
          AND o.created_at >= ${new Date(startDate.getTime() - (days * 24 * 60 * 60 * 1000))}
          AND o.created_at < ${startDate}
          AND o.status = 'DELIVERED'
      `,

      // Total orders for the period
      prisma.order.count({
        where: {
          foodItems: { some: { canteenId: canteen.id } },
          createdAt: { gte: startDate, lte: endDate }
        }
      }),

      // Previous period orders for comparison
      prisma.order.count({
        where: {
          foodItems: { some: { canteenId: canteen.id } },
          createdAt: { 
            gte: new Date(startDate.getTime() - (days * 24 * 60 * 60 * 1000)), 
            lt: startDate 
          }
        }
      }),

      // Total unique customers
      prisma.order.groupBy({
        by: ['customerId'],
        where: {
          foodItems: { some: { canteenId: canteen.id } },
          createdAt: { gte: startDate, lte: endDate }
        }
      }),

      // Orders by status
      prisma.order.groupBy({
        by: ['status'],
        where: {
          foodItems: { some: { canteenId: canteen.id } },
          createdAt: { gte: startDate, lte: endDate }
        },
        _count: true
      }),

      // Top performing items with revenue calculation
      prisma.$queryRaw<Array<{ foodId: string; name: string; totalQuantity: number; totalRevenue: number }>>`
        SELECT 
          ofi.food_id as "foodId",
          cf.name,
          SUM(ofi.quantity) as "totalQuantity",
          SUM(cf.price * ofi.quantity) as "totalRevenue"
        FROM "OrderFoodItem" ofi
        JOIN "CanteenFood" cf ON ofi.food_id = cf.id
        JOIN "Order" o ON ofi.order_id = o.id
        WHERE ofi.canteen_id = ${canteen.id}
          AND o.created_at >= ${startDate}
          AND o.created_at <= ${endDate}
          AND o.status IN ('DELIVERED', 'IN_PROGRESS', 'ACCEPTED')
        GROUP BY ofi.food_id, cf.name
        ORDER BY SUM(ofi.quantity) DESC
        LIMIT 5
      `,

      // Daily revenue data
      prisma.$queryRaw<Array<{ date: Date; revenue: number }>>`
        SELECT 
          DATE(o.created_at) as date,
          COALESCE(SUM(cf.price * ofi.quantity), 0) as revenue
        FROM "Order" o
        JOIN "OrderFoodItem" ofi ON o.id = ofi.order_id
        JOIN "CanteenFood" cf ON ofi.food_id = cf.id
        WHERE ofi.canteen_id = ${canteen.id}
          AND o.created_at >= ${startDate}
          AND o.created_at <= ${endDate}
          AND o.status = 'DELIVERED'
        GROUP BY DATE(o.created_at)
        ORDER BY DATE(o.created_at)
      `,

      // Daily orders data
      prisma.$queryRaw<Array<{ date: Date; orders: number }>>`
        SELECT 
          DATE(o.created_at) as date,
          COUNT(DISTINCT o.id) as orders
        FROM "Order" o
        JOIN "OrderFoodItem" ofi ON o.id = ofi.order_id
        WHERE ofi.canteen_id = ${canteen.id}
          AND o.created_at >= ${startDate}
          AND o.created_at <= ${endDate}
        GROUP BY DATE(o.created_at)
        ORDER BY DATE(o.created_at)
      `,

      // Hourly orders pattern
      prisma.$queryRaw<Array<{ hour: number; orders: number }>>`
        SELECT 
          EXTRACT(HOUR FROM o.created_at) as hour,
          COUNT(DISTINCT o.id) as orders
        FROM "Order" o
        JOIN "OrderFoodItem" ofi ON o.id = ofi.order_id
        WHERE ofi.canteen_id = ${canteen.id}
          AND o.created_at >= ${startDate}
          AND o.created_at <= ${endDate}
        GROUP BY EXTRACT(HOUR FROM o.created_at)
        ORDER BY EXTRACT(HOUR FROM o.created_at)
      `
    ]);

    // Format response data
    const revenue = revenueData[0]?.total || 0;
    const prevRevenue = previousRevenueData[0]?.total || 0;
    const revenueChange = prevRevenue > 0 ? ((revenue - prevRevenue) / prevRevenue) * 100 : 0;

    const ordersChange = previousOrders > 0 ? ((totalOrders - previousOrders) / previousOrders) * 100 : 0;

    const statusColors: Record<string, string> = {
      DELIVERED: '#10b981',
      PENDING: '#f59e0b',
      CANCELLED: '#ef4444',
      IN_PROGRESS: '#3b82f6',
      ACCEPTED: '#8b5cf6'
    };

    // Get unique customers count
    const uniqueCustomers = totalCustomers.length;

    const analyticsData = {
      revenue: {
        total: revenue,
        change: revenueChange,
        chartData: dailyRevenue.map(item => ({
          date: new Date(item.date).toLocaleDateString('en-US', { weekday: 'short' }),
          revenue: Number(item.revenue)
        }))
      },
      orders: {
        total: totalOrders,
        change: ordersChange,
        chartData: dailyOrders.map(item => ({
          date: new Date(item.date).toLocaleDateString('en-US', { weekday: 'short' }),
          orders: Number(item.orders)
        }))
      },
      customers: {
        total: uniqueCustomers,
        new: Math.floor(uniqueCustomers * 0.3), // Estimate
        returning: Math.floor(uniqueCustomers * 0.7)
      },
      topItems: topItemsData.map(item => ({
        id: item.foodId,
        name: item.name,
        orders: Number(item.totalQuantity),
        revenue: Number(item.totalRevenue)
      })),
      ordersByStatus: ordersByStatus.map(item => ({
        status: item.status,
        count: item._count,
        color: statusColors[item.status] || '#6b7280'
      })),
      hourlyOrders: hourlyOrders.map(item => ({
        hour: `${Math.floor(item.hour)}:00`,
        orders: Number(item.orders)
      })),
      averageRating: 4.5, // Placeholder until review system is implemented
      totalReviews: uniqueCustomers
    };

    return NextResponse.json(analyticsData);

  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}