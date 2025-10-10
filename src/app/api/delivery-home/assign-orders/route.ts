import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify the user is a delivery person
    const deliveryPerson = await prisma.deliveryPerson.findUnique({
      where: { userId },
    });

    if (!deliveryPerson) {
      return NextResponse.json({ error: "Not a delivery person" }, { status: 403 });
    }

    // Find orders that need to be assigned or create sample orders
    let pendingOrders = await prisma.order.findMany({
      where: {
        status: "PENDING",
        assignedTo: null,
      },
      take: 3,
    });

    if (pendingOrders.length === 0) {
      // Create some sample orders for testing
      const customers = await prisma.customer.findMany({ take: 2 });
      const canteens = await prisma.canteen.findMany({ take: 2 });
      const foods = await prisma.canteenFood.findMany({ take: 5 });

      if (customers.length > 0 && canteens.length > 0 && foods.length > 0) {
        for (let i = 0; i < 3; i++) {
          const customer = customers[i % customers.length];
          const canteen = canteens[i % canteens.length];
          const food = foods[i % foods.length];

          const order = await prisma.order.create({
            data: {
              customerId: customer.userId,
              status: "PENDING",
              totalPrice: food.price * (i + 1),
            },
          });

          await prisma.orderFoodItem.create({
            data: {
              orderId: order.id,
              foodId: food.id,
              canteenId: canteen.id,
              quantity: i + 1,
            },
          });
        }

        // Fetch the newly created orders
        pendingOrders = await prisma.order.findMany({
          where: {
            status: "PENDING",
            assignedTo: null,
          },
          take: 3,
        });
      }
    }

    // Assign orders to this delivery person
    const assignedOrders = [];
    for (const order of pendingOrders) {
      const updatedOrder = await prisma.order.update({
        where: { id: order.id },
        data: {
          assignedTo: userId,
          status: "ACCEPTED",
        },
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
      assignedOrders.push(updatedOrder);
    }

    return NextResponse.json({ 
      message: `Assigned ${assignedOrders.length} orders to delivery person`,
      orders: assignedOrders
    });

  } catch (error) {
    console.error("Error creating sample orders:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}