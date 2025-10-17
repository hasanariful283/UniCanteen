"use server";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const canteens = await prisma.canteen.findMany({
            select: {
                id: true,
                name: true,
                canteen_image: true,
                _count: {
                    select: {
                        reviews: true
                    }
                }
            },
            orderBy: {
                name: 'asc'
            }
        });

        return NextResponse.json({ canteens });
    } catch (error) {
        console.error('Error fetching canteens:', error);
        return NextResponse.json(
            { error: "Failed to fetch canteens" },
            { status: 500 }
        );
    }
}