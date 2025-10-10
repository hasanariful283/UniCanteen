import { auth } from "@clerk/nextjs/server";
import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

// GET orders for canteen
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get canteen info
    const canteen = await prisma.canteen.findFirst({
      where: { ownerId: userId },
    });

    if (!canteen) {
      return NextResponse.json({ error: "Canteen not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    // Build where clause
    const whereClause: any = {
      foodItems: {
        some: {
          canteenId: canteen.id
        }
      }
    };

    if (status && status !== 'all') {
      whereClause.status = status.toUpperCase();
    }

    if (search) {
      whereClause.OR = [
        {
          id: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          customer: {
            user: {
              name: {
                contains: search,
                mode: 'insensitive'
              }
            }
          }
        }
      ];
    }

    // Fetch orders
    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        foodItems: {
          where: {
            canteenId: canteen.id
          },
          include: {
            food: {
              select: {
                id: true,
                name: true,
                price: true,
                image: true,
              },
            },
          },
        },
        customer: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        deliveryMan: {
          include: {
            user: {
              select: {
                name: true,
                phone: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: offset,
      take: limit,
    });

    // Get total count for pagination
    const totalCount = await prisma.order.count({
      where: whereClause,
    });

    // Calculate subtotals for each order (only items from this canteen)
    const ordersWithSubtotals = orders.map(order => {
      const subtotal = order.foodItems.reduce((sum, item) => {
        return sum + (item.food.price * item.quantity);
      }, 0);

      return {
        ...order,
        subtotal,
        itemCount: order.foodItems.reduce((sum, item) => sum + item.quantity, 0)
      };
    });

    return NextResponse.json({ 
      orders: ordersWithSubtotals,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}