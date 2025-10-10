import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get counts of all relevant data
    const counts = {
      users: await prisma.user.count(),
      customers: await prisma.customer.count(),
      canteens: await prisma.canteen.count(),
      deliveryPersons: await prisma.deliveryPerson.count(),
      orders: await prisma.order.count(),
      reports: await prisma.customerReport.count(),
    };

    // Get current user info
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    const currentDeliveryPerson = await prisma.deliveryPerson.findUnique({
      where: { userId },
    });

    // Get all reports for this user if they are a delivery person
    const reportsForUser = currentDeliveryPerson ? await prisma.customerReport.findMany({
      where: { deliveryPersonId: userId },
    }) : [];

    return NextResponse.json({
      userId,
      counts,
      currentUser,
      currentDeliveryPerson: currentDeliveryPerson ? 'Yes' : 'No',
      reportsForUser: reportsForUser.length,
    });

  } catch (error) {
    console.error("Debug API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}