// Sync customer data with database including phone and profile info
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, email, name, phone, uiuId } = body;
    if (!userId || !email) {
      return NextResponse.json({ error: "Missing userId or email" }, { status: 400 });
    }

    // Upsert User
    await prisma.user.upsert({
      where: { id: userId },
      update: {
        email,
        name,
        phone,
        userRole: "CUSTOMER",
      },
      create: {
        id: userId,
        email,
        name,
        phone,
        userRole: "CUSTOMER",
      },
    });

    // Upsert Customer
    await prisma.customer.upsert({
      where: { userId },
      update: { uiuId },
      create: { userId, uiuId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
