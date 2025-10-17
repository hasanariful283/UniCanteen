"use server";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
    try {
        const url = new URL(req.url);
        const canteenId = url.searchParams.get('canteenId');
        const sortBy = url.searchParams.get('sortBy') || 'newest';
        const rating = url.searchParams.get('rating');

        let whereClause: any = {};

        // Filter by canteen if specified
        if (canteenId && canteenId !== 'all') {
            whereClause.canteenId = canteenId;
        }

        // Filter by rating if specified
        if (rating && rating !== 'all') {
            whereClause.rating = parseInt(rating);
        }

        let orderBy: any = {};
        switch (sortBy) {
            case 'oldest':
                orderBy = { createdAt: 'asc' };
                break;
            case 'rating_high':
                orderBy = { rating: 'desc' };
                break;
            case 'rating_low':
                orderBy = { rating: 'asc' };
                break;
            default: // newest
                orderBy = { createdAt: 'desc' };
        }

        const reviews = await prisma.canteenReviews.findMany({
            where: whereClause,
            include: {
                canteen: {
                    select: {
                        id: true,
                        name: true,
                        canteen_image: true
                    }
                },
                customer: {
                    include: {
                        user: {
                            select: {
                                name: true,
                                email: true
                            }
                        }
                    }
                }
            },
            orderBy,
            take: 50 // Limit to 50 reviews
        });

        // Get review statistics
        const stats = await prisma.canteenReviews.aggregate({
            where: whereClause,
            _avg: {
                rating: true
            },
            _count: {
                id: true
            }
        });

        // Get rating distribution
        const ratingDistribution = await prisma.canteenReviews.groupBy({
            by: ['rating'],
            where: whereClause,
            _count: {
                rating: true
            },
            orderBy: {
                rating: 'desc'
            }
        });

        return NextResponse.json({ 
            reviews, 
            stats: {
                totalReviews: stats._count.id,
                averageRating: stats._avg.rating ? parseFloat(stats._avg.rating.toFixed(1)) : 0
            },
            ratingDistribution
        });
    } catch (error) {
        console.error('Error fetching reviews:', error);
        return NextResponse.json(
            { error: "Failed to fetch reviews" },
            { status: 500 }
        );
    }
}