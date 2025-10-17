"use server";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
    try {
        const { userId } = await auth();
        
        if (!userId) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Get customer reviews with canteen information
        const reviews = await prisma.canteenReviews.findMany({
            where: {
                userId: userId
            },
            include: {
                canteen: {
                    select: {
                        id: true,
                        name: true,
                        canteen_image: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return NextResponse.json({ reviews });
    } catch (error) {
        console.error('Error fetching customer reviews:', error);
        return NextResponse.json(
            { error: "Failed to fetch reviews" },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth();
        
        if (!userId) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { canteenId, rating, comment } = await req.json();

        // Validate input
        if (!canteenId || !rating || rating < 1 || rating > 5) {
            return NextResponse.json(
                { error: "Invalid input. Rating must be between 1 and 5." },
                { status: 400 }
            );
        }

        // Check if customer exists
        const customer = await prisma.customer.findUnique({
            where: { userId }
        });

        if (!customer) {
            return NextResponse.json(
                { error: "Customer not found" },
                { status: 404 }
            );
        }

        // Check if canteen exists
        const canteen = await prisma.canteen.findUnique({
            where: { id: canteenId }
        });

        if (!canteen) {
            return NextResponse.json(
                { error: "Canteen not found" },
                { status: 404 }
            );
        }

        // Create the review
        const review = await prisma.canteenReviews.create({
            data: {
                canteenId,
                userId,
                rating,
                comment: comment || null
            },
            include: {
                canteen: {
                    select: {
                        id: true,
                        name: true,
                        canteen_image: true
                    }
                }
            }
        });

        return NextResponse.json({ 
            message: "Review submitted successfully",
            review 
        });
    } catch (error) {
        console.error('Error creating review:', error);
        return NextResponse.json(
            { error: "Failed to create review" },
            { status: 500 }
        );
    }
}

export async function PUT(req: NextRequest) {
    try {
        const { userId } = await auth();
        
        if (!userId) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { reviewId, rating, comment } = await req.json();

        // Validate input
        if (!reviewId || !rating || rating < 1 || rating > 5) {
            return NextResponse.json(
                { error: "Invalid input. Rating must be between 1 and 5." },
                { status: 400 }
            );
        }

        // Check if the review belongs to the current user
        const existingReview = await prisma.canteenReviews.findUnique({
            where: { id: reviewId }
        });

        if (!existingReview || existingReview.userId !== userId) {
            return NextResponse.json(
                { error: "Review not found or unauthorized" },
                { status: 404 }
            );
        }

        // Update the review
        const updatedReview = await prisma.canteenReviews.update({
            where: { id: reviewId },
            data: {
                rating,
                comment: comment || null,
                updatedAt: new Date()
            },
            include: {
                canteen: {
                    select: {
                        id: true,
                        name: true,
                        canteen_image: true
                    }
                }
            }
        });

        return NextResponse.json({ 
            message: "Review updated successfully",
            review: updatedReview 
        });
    } catch (error) {
        console.error('Error updating review:', error);
        return NextResponse.json(
            { error: "Failed to update review" },
            { status: 500 }
        );
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const { userId } = await auth();
        
        if (!userId) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const url = new URL(req.url);
        const reviewId = url.searchParams.get('reviewId');

        if (!reviewId) {
            return NextResponse.json(
                { error: "Review ID is required" },
                { status: 400 }
            );
        }

        // Check if the review belongs to the current user
        const existingReview = await prisma.canteenReviews.findUnique({
            where: { id: reviewId }
        });

        if (!existingReview || existingReview.userId !== userId) {
            return NextResponse.json(
                { error: "Review not found or unauthorized" },
                { status: 404 }
            );
        }

        // Delete the review
        await prisma.canteenReviews.delete({
            where: { id: reviewId }
        });

        return NextResponse.json({ 
            message: "Review deleted successfully"
        });
    } catch (error) {
        console.error('Error deleting review:', error);
        return NextResponse.json(
            { error: "Failed to delete review" },
            { status: 500 }
        );
    }
}