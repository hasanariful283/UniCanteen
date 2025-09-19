import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function POST(_req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // find customer
    const customer = await prisma.customer.findUnique({ where: { userId } });
    if (!customer)
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });

    // fetch cart with items and food (to read price and canteenId)
    const cart = await prisma.cart.findUnique({
      where: { customerId: customer.userId },
      include: {
        items: {
          include: {
            food: true,
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    const totalPrice = cart.items.reduce((sum, it) => sum + (it.food?.price || 0) * it.quantity, 0);

    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          customerId: customer.userId,
          totalPrice,
          status: "PENDING",
        },
      });

      // create order items
      await tx.orderFoodItem.createMany({
        data: cart.items.map((it) => ({
          orderId: order.id,
          foodId: it.foodId,
          canteenId: it.food.canteenId,
          quantity: it.quantity,
        })),
      });

      // clear cart
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      return order.id;
    });

    const created = await prisma.order.findUnique({
      where: { id: result },
      include: {
        foodItems: {
          include: {
            food: true,
            canteen: true,
          },
        },
      },
    });

    return NextResponse.json({ order: created });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
