import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
    console.log(req.body);
    try {
        const { userId } = await auth();
        if (!userId)
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );

        const { foodId, quantity = 1 } = await req.json();
        if (!foodId)
            return NextResponse.json(
                { error: "Missing foodId" },
                { status: 400 }
            );

        // Find the customer by userId
        const customer = await prisma.customer.findUnique({
            where: { userId },
        });
        if (!customer)
            return NextResponse.json(
                { error: "Customer not found" },
                { status: 404 }
            );

        // Find or create cart
        let cart = await prisma.cart.findUnique({
            where: { customerId: customer.userId },
        });
        if (!cart) {
            cart = await prisma.cart.create({
                data: { customerId: customer.userId },
            });
        }

        // Find cart item
        const existingItem = await prisma.cartItem.findFirst({
            where: { cartId: cart.id, foodId },
        });

        if (existingItem) {
            await prisma.cartItem.update({
                where: { id: existingItem.id },
                data: { quantity: { increment: quantity } },
            });
        } else {
            await prisma.cartItem.create({
                data: { cartId: cart.id, foodId, quantity },
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
        );
    }
}
