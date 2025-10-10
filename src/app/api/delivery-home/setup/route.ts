import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    let user = existingUser;
    if (!user) {
      // Create user if not exists
      user = await prisma.user.create({
        data: {
          id: userId,
          email: "delivery@test.com",
          name: "Test Delivery Person",
          phone: "+8801234567890",
          userRole: "DELIVERY_PERSON",
        },
      });
    }

    // Check if delivery person already exists
    const existingDeliveryPerson = await prisma.deliveryPerson.findUnique({
      where: { userId },
    });

    let deliveryPerson = existingDeliveryPerson;
    if (!deliveryPerson) {
      // Create delivery person record
      deliveryPerson = await prisma.deliveryPerson.create({
        data: {
          userId: userId,
          uiuId: "DP" + Math.floor(Math.random() * 10000),
        },
      });
    }

    // Create delivery profile if not exists
    const existingProfile = await prisma.deliveryProfile.findUnique({
      where: { userId },
    });

    if (!existingProfile) {
      await prisma.deliveryProfile.create({
        data: {
          userId,
          isAvailable: true,
          orderNotifications: true,
          messageNotifications: true,
          earningsNotifications: false,
          promotionNotifications: false,
          soundEnabled: true,
          showPhoneToCustomers: true,
          showLocationWhenOnline: true,
          allowCustomerRatings: true,
          language: 'en',
          theme: 'light',
          defaultStartTime: '09:00',
          defaultEndTime: '22:00',
        },
      });
    }

    return NextResponse.json({ 
      message: "Delivery person setup completed",
      userId,
      deliveryPersonId: deliveryPerson.userId
    });

  } catch (error) {
    console.error("Error setting up delivery person:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}