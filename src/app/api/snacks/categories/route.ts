"use server";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        // Get unique categories from all canteen foods
        const foods = await prisma.canteenFood.findMany({
            where: {
                availability: true
            },
            select: {
                category: true
            }
        });

        // Extract unique categories
        const categorySet = new Set<string>();
        foods.forEach(food => {
            food.category.forEach(cat => categorySet.add(cat));
        });

        const categories = Array.from(categorySet).map(cat => ({
            id: cat,
            name: cat,
            count: foods.filter(food => food.category.includes(cat as any)).length
        }));

        return NextResponse.json({ categories });
    } catch (error) {
        console.error('Error fetching categories:', error);
        return NextResponse.json(
            { error: "Failed to fetch categories" },
            { status: 500 }
        );
    }
}