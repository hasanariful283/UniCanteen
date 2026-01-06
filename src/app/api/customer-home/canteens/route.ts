import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all canteens
    const canteens = await prisma.canteen.findMany({
      select: {
        id: true,
        name: true,
        canteen_image: true,
        owner: {
          select: {
            name: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    return NextResponse.json({
      canteens,
      success: true
    });

  } catch (error) {
    console.error("Error fetching canteens:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}