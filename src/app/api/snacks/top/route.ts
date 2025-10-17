"use server";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
    try {
        const url = new URL(req.url);
        const category = url.searchParams.get('category');
        const sortBy = url.searchParams.get('sortBy') || 'POPULAR';
        const minPrice = parseFloat(url.searchParams.get('minPrice') || '0');
        const maxPrice = parseFloat(url.searchParams.get('maxPrice') || '1000');
        const search = url.searchParams.get('search') || '';

        let whereClause: any = {
            availability: true,
            price: {
                gte: minPrice,
                lte: maxPrice
            }
        };

        // Add category filter if specified and not 'ALL'
        if (category && category !== 'ALL') {
            whereClause.category = {
                has: category
            };
        }

        // Add search filter
        if (search) {
            whereClause.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } }
            ];
        }

        let orderBy: any = {};
        switch (sortBy) {
            case 'PRICE_LOW':
                orderBy = { price: 'asc' };
                break;
            case 'PRICE_HIGH':
                orderBy = { price: 'desc' };
                break;
            case 'RATING':
                orderBy = { rating: 'desc' };
                break;
            case 'NAME':
                orderBy = { name: 'asc' };
                break;
            default: // POPULAR
                orderBy = { rating: 'desc' };
        }

        const allFoods = await prisma.canteenFood.findMany({
            where: whereClause,
            include: {
                canteen: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            },
            orderBy,
            take: 50 // Limit to top 50 items
        });

        // Transform the data to match the expected format
        const transformedFoods = allFoods.map(food => ({
            id: food.id,
            name: food.name,
            description: food.description || '',
            price: food.price,
            image: food.image || '/api/placeholder/300/200',
            rating: food.rating,
            reviewCount: Math.floor(Math.random() * 200) + 50, // Mock review count
            category: food.category[0] || 'SNACKS',
            canteenName: food.canteen.name,
            canteenId: food.canteen.id,
            preparationTime: Math.floor(Math.random() * 15) + 3, // Mock preparation time
            isVeg: Math.random() > 0.3, // Mock veg status
            isSpicy: Math.random() > 0.6, // Mock spicy status
            isPopular: food.rating >= 4.0,
            orderCount: Math.floor(Math.random() * 1000) + 100, // Mock order count
            discount: Math.random() > 0.8 ? Math.floor(Math.random() * 20) + 5 : undefined
        }));

        return NextResponse.json({ snacks: transformedFoods });
    } catch (error) {
        console.error('Error fetching snacks:', error);
        return NextResponse.json(
            { error: "Failed to fetch snacks" },
            { status: 500 }
        );
    }
}