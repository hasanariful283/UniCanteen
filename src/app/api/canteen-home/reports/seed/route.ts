import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

// API to seed sample reports for testing
export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Find canteens owned by this user
    const canteens = await prisma.canteen.findMany({ 
      where: { ownerId: userId }
    });
    
    if (canteens.length === 0) {
      return NextResponse.json({ error: "No canteens found" }, { status: 404 });
    }

    // Get first canteen for seeding
    const canteen = canteens[0];

    // Find some customers and orders for realistic data
    const customers = await prisma.customer.findMany({
      take: 5,
      include: {
        user: true
      }
    });

    const orders = await prisma.order.findMany({
      take: 3,
      include: {
        foodItems: true
      }
    });

    // Sample reports data with proper enum values
    const sampleReports = [
      {
        type: "FOOD_QUALITY" as const,
        title: "Food was cold and tasteless",
        description: "I ordered chicken curry but it arrived cold and had no taste. Very disappointed with the quality.",
        priority: "HIGH" as const,
        rating: 2,
        customerId: customers[0]?.userId || "dummy_customer_1",
        canteenId: canteen.id,
        orderId: orders[0]?.id || undefined,
        foodItemId: orders[0]?.foodItems[0]?.id || undefined
      },
      {
        type: "SERVICE" as const,
        title: "Rude staff behavior",
        description: "The staff was very rude when I asked about my order delay. Unprofessional behavior.",
        priority: "MEDIUM" as const,
        customerId: customers[1]?.userId || "dummy_customer_2",
        canteenId: canteen.id
      },
      {
        type: "HYGIENE" as const,
        title: "Found hair in food",
        description: "I found a hair in my rice bowl. This is completely unacceptable and unhygienic.",
        priority: "URGENT" as const,
        rating: 1,
        status: "RESOLVED" as const,
        response: "We sincerely apologize for this incident. We have taken immediate action to improve our kitchen hygiene standards and retrained our staff. A full refund has been processed.",
        customerId: customers[2]?.userId || "dummy_customer_3",
        canteenId: canteen.id,
        orderId: orders[1]?.id || undefined,
        foodItemId: orders[1]?.foodItems[0]?.id || undefined
      },
      {
        type: "DELIVERY" as const,
        title: "Late delivery",
        description: "My order was supposed to arrive in 30 minutes but took over an hour. Food was cold by then.",
        priority: "MEDIUM" as const,
        rating: 3,
        status: "RESOLVED" as const,
        response: "We apologize for the delay. There was heavy traffic that day. We've improved our delivery time estimates and added more delivery personnel.",
        customerId: customers[3]?.userId || "dummy_customer_4",
        canteenId: canteen.id,
        orderId: orders[2]?.id || undefined
      },
      {
        type: "OTHER" as const,
        title: "Wrong order received",
        description: "I ordered vegetarian meals but received non-vegetarian food. This is a serious issue for me as I'm vegetarian.",
        priority: "HIGH" as const,
        rating: 1,
        customerId: customers[4]?.userId || "dummy_customer_5",
        canteenId: canteen.id
      }
    ];

    // Create reports in database
    const createdReports = [];
    for (const reportData of sampleReports) {
      try {
        const report = await prisma.customerReport.create({
          data: reportData,
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
        createdReports.push(report);
      } catch (error) {
        console.log(`Failed to create report: ${reportData.title}`, error);
        // Continue with other reports even if one fails
      }
    }

    return NextResponse.json({ 
      message: `Successfully created ${createdReports.length} sample reports`,
      reports: createdReports 
    });

  } catch (error) {
    console.error("Seed Reports API Error:", error);
    return NextResponse.json({ error: "Failed to seed reports" }, { status: 500 });
  }
}