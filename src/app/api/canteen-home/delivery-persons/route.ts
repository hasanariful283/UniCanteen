import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const search = url.searchParams.get('search');
    const status = url.searchParams.get('status') || 'all';
    const sort = url.searchParams.get('sort') || 'name';

    // Get canteen info
    const canteen = await prisma.canteen.findFirst({
      where: { ownerId: userId },
    });

    if (!canteen) {
      return NextResponse.json({ error: "Canteen not found" }, { status: 404 });
    }

    // Build where clause for filtering
    const whereClause: any = {};

    if (search) {
      whereClause.OR = [
        { 
          user: {
            name: { contains: search, mode: 'insensitive' }
          }
        },
        { 
          user: {
            phone: { contains: search, mode: 'insensitive' }
          }
        },
        { 
          user: {
            email: { contains: search, mode: 'insensitive' }
          }
        }
      ];
    }

    if (status === 'available') {
      whereClause.DeliveryProfile = {
        isAvailable: true
      };
    } else if (status === 'unavailable') {
      whereClause.DeliveryProfile = {
        isAvailable: false
      };
    }

    // Build order clause for sorting
    let orderBy: any = {};
    switch (sort) {
      case 'rating':
        orderBy = { DeliveryProfile: { rating: 'desc' } };
        break;
      case 'deliveries':
        orderBy = { DeliveryProfile: { completed: 'desc' } };
        break;
      case 'joined':
        orderBy = { createdAt: 'desc' };
        break;
      default: // name
        orderBy = { user: { name: 'asc' } };
    }

    // Calculate date range for today's stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Parallel queries for delivery persons data and stats
    const [deliveryPersons, totalCount, availableCount, avgRating, completedToday, ongoingDeliveries] = await Promise.all([
      // Get filtered delivery persons
      prisma.deliveryPerson.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              name: true,
              phone: true,
              email: true,
            }
          },
          DeliveryProfile: true,
          _count: {
            select: {
              deliveries: true
            }
          }
        },
        orderBy,
        take: 50, // Limit to 50 delivery persons per page
      }),

      // Total delivery persons count
      prisma.deliveryPerson.count(),

      // Available delivery persons count
      prisma.deliveryPerson.count({
        where: {
          DeliveryProfile: {
            isAvailable: true
          }
        }
      }),

      // Average rating across all delivery persons
      prisma.deliveryProfile.aggregate({
        _avg: { rating: true },
        where: {
          rating: { not: null }
        }
      }),

      // Orders completed today
      prisma.order.count({
        where: {
          status: 'DELIVERED',
          updatedAt: {
            gte: today,
            lt: tomorrow
          },
          assignedTo: { not: null }
        }
      }),

      // Ongoing deliveries
      prisma.order.count({
        where: {
          status: { in: ['IN_PROGRESS', 'ACCEPTED'] },
          assignedTo: { not: null }
        }
      })
    ]);

    // Get total deliveries count
    const totalDeliveries = await prisma.order.count({
      where: {
        assignedTo: { not: null }
      }
    });

    const stats = {
      totalDeliveryPersons: totalCount,
      availableNow: availableCount,
      averageRating: avgRating._avg.rating || 0,
      totalDeliveries,
      ongoingDeliveries,
      completedToday
    };

    return NextResponse.json({
      deliveryPersons,
      stats
    });

  } catch (error) {
    console.error("Error fetching delivery persons:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Add a new delivery person (future feature)
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, phone, email, vehicleType, address } = body;

    if (!name || !phone) {
      return NextResponse.json({ error: "Name and phone are required" }, { status: 400 });
    }

    // Get canteen info
    const canteen = await prisma.canteen.findFirst({
      where: { ownerId: userId },
    });

    if (!canteen) {
      return NextResponse.json({ error: "Canteen not found" }, { status: 404 });
    }

    // For now, we'll just return success as adding delivery persons might involve
    // a more complex invitation/registration process
    return NextResponse.json({ 
      message: "Delivery person invitation functionality coming soon",
      data: { name, phone, email, vehicleType, address }
    });

  } catch (error) {
    console.error("Error adding delivery person:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH - Update delivery person status or details (future feature)
export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { deliveryPersonId, action, data } = body;

    if (!deliveryPersonId || !action) {
      return NextResponse.json({ error: "Delivery person ID and action are required" }, { status: 400 });
    }

    // Get canteen info
    const canteen = await prisma.canteen.findFirst({
      where: { ownerId: userId },
    });

    if (!canteen) {
      return NextResponse.json({ error: "Canteen not found" }, { status: 404 });
    }

    // For now, we'll just return success as this functionality would require
    // proper permissions and relationship management
    return NextResponse.json({ 
      message: `Delivery person ${action} functionality coming soon`,
      deliveryPersonId,
      action,
      data
    });

  } catch (error) {
    console.error("Error updating delivery person:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}