// Add new food items to canteen menu with image upload support
import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const user = await currentUser();
        const userId = user?.id;
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const data = await req.json();
        
        // Find canteen first
        const canteen = await prisma.canteen.findFirst({
            where: { ownerId: userId }
        });

        if (!canteen) {
            return NextResponse.json({ error: "Canteen not found" }, { status: 404 });
        }

        // Create food item
        const foodItem = await prisma.canteenFood.create({
            data: {
                id: data.id,
                canteenId: canteen.id,
                name: data.name,
                price: data.price,
                description: data.description,
                category: {
                    set: data.category
                },
                image: data.image,
                rating: 0,
                stocks: data.stocks,
                availability: data.availability
            }
        });

        return NextResponse.json(foodItem);
    } catch (error) {
        console.error("Error adding food item:", error);
        return NextResponse.json(
            { error: "Failed to add food item" }, 
            { status: 500 }
        );
    }
}
