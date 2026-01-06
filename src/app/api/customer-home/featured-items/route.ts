// Fetch featured food items displayed on customer home page
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const items = await prisma.featuredItems.findMany({
    where: { isFeatured: true },
    include: { food: true },
    orderBy: { createdAt: "desc" },
  });
  if (!items || items.length === 0) {
    return NextResponse.json({ message: "No featured items found" }, { status: 404 });
  }
  return NextResponse.json(items);
  // return NextResponse.json([]);
}