import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Find customer
    const customer = await prisma.customer.findUnique({ where: { userId } });
    if (!customer) return NextResponse.json({ error: "Customer not found" }, { status: 404 });

    // Find cart and items
    const cart = await prisma.cart.findUnique({
      where: { customerId: customer.userId },
      include: {
        items: {
          include: {
            food: {
              include: {
                canteen: true,
              },
            },
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
