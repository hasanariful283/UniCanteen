import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    console.log('[Complaints API] User ID:', userId);
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify the user is a delivery person
    const deliveryPerson = await prisma.deliveryPerson.findUnique({
      where: { userId },
    });

    console.log('[Complaints API] Delivery person found:', deliveryPerson ? 'Yes' : 'No');

    if (!deliveryPerson) {
      return NextResponse.json({ 
        error: "Not a delivery person", 
        details: "User is not registered as a delivery person",
        userId: userId
      }, { status: 403 });
    }

    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const type = url.searchParams.get('type');
    const priority = url.searchParams.get('priority');

    // Build the where clause for filtering
    const where: any = {
      deliveryPersonId: userId,
    };

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (type && type !== 'ALL') {
      where.type = type;
    }

    if (priority && priority !== 'ALL') {
      where.priority = priority;
    }

    console.log('[Complaints API] Query where clause:', where);

    // Fetch reports filed against this delivery person
    const reports = await prisma.customerReport.findMany({
      where,
      include: {
        customer: {
          include: {
            user: {
              select: { name: true, phone: true }
            }
          }
        },
        canteen: {
          select: { name: true }
        },
        order: {
          select: { 
            id: true, 
            totalPrice: true,
            createdAt: true,
            status: true
          }
        },
        foodItem: {
          include: {
            food: {
              select: { name: true }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Get summary statistics
    const totalReports = reports.length;
    const pendingReports = reports.filter(r => r.status === 'PENDING').length;
    const resolvedReports = reports.filter(r => r.status === 'RESOLVED').length;
    const highPriorityReports = reports.filter(r => r.priority === 'HIGH' || r.priority === 'URGENT').length;

    // Calculate average rating from reports with ratings
    const reportsWithRatings = reports.filter(r => r.rating !== null);
    const averageRating = reportsWithRatings.length > 0 
      ? reportsWithRatings.reduce((sum, r) => sum + (r.rating || 0), 0) / reportsWithRatings.length
      : null;

    // Group reports by type for statistics
    const reportsByType = reports.reduce((acc, report) => {
      acc[report.type] = (acc[report.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Recent trends (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentReports = reports.filter(r => new Date(r.createdAt) >= sevenDaysAgo);
    const trendsData = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayReports = recentReports.filter(r => {
        const reportDate = new Date(r.createdAt);
        return reportDate.toDateString() === date.toDateString();
      });
      
      trendsData.push({
        date: date.toISOString().split('T')[0],
        count: dayReports.length,
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' })
      });
    }

    const response = {
      reports: reports.map(report => ({
        id: report.id,
        type: report.type,
        title: report.title,
        description: report.description,
        status: report.status,
        priority: report.priority,
        rating: report.rating,
        response: report.response,
        createdAt: report.createdAt,
        updatedAt: report.updatedAt,
        customer: {
          name: report.customer.user.name,
          phone: report.customer.user.phone
        },
        canteen: {
          name: report.canteen.name
        },
        order: report.order,
        foodItem: report.foodItem ? {
          name: report.foodItem.food.name,
          quantity: report.foodItem.quantity
        } : null
      })),
      summary: {
        totalReports,
        pendingReports,
        resolvedReports,
        highPriorityReports,
        averageRating: averageRating ? Math.round(averageRating * 10) / 10 : null,
        reportsByType,
        trends: trendsData
      }
    };

    return NextResponse.json(response);
    console.log('[Complaints API] Reports found:', reports.length);
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching delivery complaints:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Internal server error",
        details: error instanceof Error ? error.stack : "Unknown error"
      },
      { status: 500 }
    );
  }
}