import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Find the customer by userId
    const customer = await prisma.customer.findUnique({ where: { userId } });
    if (!customer) return NextResponse.json({ error: "Customer not found" }, { status: 404 });

    // Find the cart with items and food details
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

    if (!cart) return NextResponse.json({ items: [] });

    return NextResponse.json({ items: cart.items });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}