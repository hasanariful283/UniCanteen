import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function PATCH(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { cartItemId, quantity } = await req.json();
    if (!cartItemId || typeof quantity !== "number") {
      return NextResponse.json(
        { error: "cartItemId and numeric quantity are required" },
        { status: 400 }
      );
    }

    const customer = await prisma.customer.findUnique({ where: { userId } });
    if (!customer)
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );

    const cart = await prisma.cart.findUnique({ where: { customerId: customer.userId } });
    if (!cart) return NextResponse.json({ error: "Cart not found" }, { status: 404 });

    const item = await prisma.cartItem.findUnique({ where: { id: cartItemId } });
    if (!item || item.cartId !== cart.id) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    if (quantity <= 0) {
      await prisma.cartItem.delete({ where: { id: cartItemId } });
      return NextResponse.json({ removed: true });
    }

    const updated = await prisma.cartItem.update({ where: { id: cartItemId }, data: { quantity } });
    return NextResponse.json({ item: updated });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
