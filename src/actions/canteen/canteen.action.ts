"use server";
import prisma from "@/lib/prisma";
export async function changeFoodAvailability(
    foodId: string,
    canteenId: string,
    currentAvailability: boolean
) {
    await prisma.canteenFood.update({
        where: { id: foodId, canteenId },
        data: { availability: !currentAvailability }, // toggle
    });

    return { success: true };
}
