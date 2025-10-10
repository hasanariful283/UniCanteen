import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Find canteens owned by this user
    const canteens = await prisma.canteen.findMany({ 
      where: { ownerId: userId }, 
      select: { id: true } 
    });
    
    const canteenIds = canteens.map(c => c.id);
    if (canteenIds.length === 0) {
      return NextResponse.json({ reports: [] });
    }

    // Fetch reports for canteens owned by this user
    const reports = await prisma.customerReport.findMany({
      where: {
        canteenId: { in: canteenIds }
      },
      include: {
        customer: {
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        },
        order: {
          select: {
            id: true,
            createdAt: true
          }
        },
        foodItem: {
          include: {
            food: {
              select: {
                name: true
              }
            }
          }
        },
        canteen: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ reports });
  } catch (error) {
    console.error("Reports API Error:", error);
    return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 });
  }
}

// Create a new report
export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { 
      type, 
      title, 
      description, 
      priority = 'MEDIUM', 
      rating,
      customerId,
      canteenId, 
      orderId,
      foodItemId 
    } = body;

    // Validate required fields
    if (!type || !title || !customerId || !canteenId) {
      return NextResponse.json({ 
        error: "Missing required fields: type, title, customerId, canteenId" 
      }, { status: 400 });
    }

    // Verify the canteen belongs to this user
    const canteen = await prisma.canteen.findFirst({
      where: { 
        id: canteenId,
        ownerId: userId 
      }
    });

    if (!canteen) {
      return NextResponse.json({ 
        error: "Canteen not found or unauthorized" 
      }, { status: 404 });
    }

    // Create the report
    const report = await prisma.customerReport.create({
      data: {
        type,
        title,
        description,
        priority,
        rating,
        customerId,
        canteenId,
        orderId,
        foodItemId
      },
      include: {
        customer: {
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        },
        order: {
          select: {
            id: true,
            createdAt: true
          }
        },
        foodItem: {
          include: {
            food: {
              select: {
                name: true
              }
            }
          }
        },
        canteen: {
          select: {
            name: true
          }
        }
      }
    });

    return NextResponse.json({ report }, { status: 201 });
  } catch (error) {
    console.error("Create Report API Error:", error);
    return NextResponse.json({ error: "Failed to create report" }, { status: 500 });
  }
}