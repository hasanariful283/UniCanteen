import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ foodId: string }> }
) {
    try {
        const { userId } = await auth();
        
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { foodId } = await params;
        const body = await request.json();

        // Get the canteen for this user
        const canteen = await prisma.canteen.findFirst({
            where: { ownerId: userId }
        });

        if (!canteen) {
            return NextResponse.json({ error: 'Canteen not found' }, { status: 404 });
        }

        // Verify that the food item belongs to this canteen
        const existingFood = await prisma.canteenFood.findFirst({
            where: { 
                id: foodId,
                canteenId: canteen.id 
            }
        });

        if (!existingFood) {
            return NextResponse.json({ error: 'Food item not found' }, { status: 404 });
        }

        // Update the food item with provided fields
        const updateData: any = {};
        if (body.name !== undefined) updateData.name = body.name;
        if (body.price !== undefined) updateData.price = parseFloat(body.price);
        if (body.description !== undefined) updateData.description = body.description;
        if (body.image !== undefined) updateData.image = body.image;
        if (body.availability !== undefined) updateData.availability = body.availability;
        if (body.stocks !== undefined) updateData.stocks = parseInt(body.stocks);
        if (body.category !== undefined) updateData.category = body.category;
        if (body.rating !== undefined) updateData.rating = parseFloat(body.rating);

        const updatedFood = await prisma.canteenFood.update({
            where: { id: foodId },
            data: updateData
        });

        return NextResponse.json(updatedFood);
    } catch (error) {
        console.error('Error updating food item:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ foodId: string }> }
) {
    try {
        const { userId } = await auth();
        
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { foodId } = await params;

        // Get the canteen for this user
        const canteen = await prisma.canteen.findFirst({
            where: { ownerId: userId }
        });

        if (!canteen) {
            return NextResponse.json({ error: 'Canteen not found' }, { status: 404 });
        }

        // Verify that the food item belongs to this canteen
        const existingFood = await prisma.canteenFood.findFirst({
            where: { 
                id: foodId,
                canteenId: canteen.id 
            }
        });

        if (!existingFood) {
            return NextResponse.json({ error: 'Food item not found' }, { status: 404 });
        }

        // Check if food item is part of any pending orders
        const pendingOrders = await prisma.orderFoodItem.findMany({
            where: {
                foodId: foodId,
                order: { status: { in: ['PENDING', 'ACCEPTED', 'IN_PROGRESS'] } }
            }
        });

        if (pendingOrders.length > 0) {
            return NextResponse.json({ 
                error: 'Cannot delete food item with pending orders. Set it as unavailable instead.' 
            }, { status: 400 });
        }

        // Delete the food item
        await prisma.canteenFood.delete({
            where: { id: foodId }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting food item:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function GET(
    request: Request,
    { params }: { params: Promise<{ foodId: string }> }
) {
    try {
        const { userId } = await auth();
        
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { foodId } = await params;

        // Get the canteen for this user
        const canteen = await prisma.canteen.findFirst({
            where: { ownerId: userId }
        });

        if (!canteen) {
            return NextResponse.json({ error: 'Canteen not found' }, { status: 404 });
        }

        // Get the food item
        const food = await prisma.canteenFood.findFirst({
            where: { 
                id: foodId,
                canteenId: canteen.id 
            }
        });

        if (!food) {
            return NextResponse.json({ error: 'Food item not found' }, { status: 404 });
        }

        return NextResponse.json(food);
    } catch (error) {
        console.error('Error fetching food item:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}