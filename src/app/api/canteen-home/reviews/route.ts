import { auth } from "@clerk/nextjs/server";
import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const rating = url.searchParams.get('rating');
    const search = url.searchParams.get('search');
    const sort = url.searchParams.get('sort') || 'newest';

    // Get canteen info
    const canteen = await prisma.canteen.findFirst({
      where: { ownerId: userId },
    });

    if (!canteen) {
      return NextResponse.json({ error: "Canteen not found" }, { status: 404 });
    }

    // Build where clause for filtering
    const whereClause: any = {
      canteenId: canteen.id,
    };

    if (rating) {
      whereClause.rating = parseInt(rating);
    }

    if (search) {
      whereClause.OR = [
        { comment: { contains: search, mode: 'insensitive' } },
        { 
          customer: {
            user: {
              name: { contains: search, mode: 'insensitive' }
            }
          }
        }
      ];
    }

    // Build order clause for sorting
    let orderBy: any = {};
    switch (sort) {
      case 'oldest':
        orderBy = { createdAt: 'asc' };
        break;
      case 'highest':
        orderBy = { rating: 'desc' };
        break;
      case 'lowest':
        orderBy = { rating: 'asc' };
        break;
      default: // newest
        orderBy = { createdAt: 'desc' };
    }

    // Parallel queries for reviews data and stats
    const [reviews, reviewStats, ratingDistribution] = await Promise.all([
      // Get filtered reviews
      prisma.canteenReviews.findMany({
        where: whereClause,
        include: {
          customer: {
            include: {
              user: {
                select: {
                  name: true,
                }
              }
            }
          }
        },
        orderBy,
        take: 50, // Limit to 50 reviews per page
      }),

      // Get overall stats
      prisma.canteenReviews.aggregate({
        where: { canteenId: canteen.id },
        _avg: { rating: true },
        _count: true,
      }),

      // Get rating distribution
      prisma.canteenReviews.groupBy({
        by: ['rating'],
        where: { canteenId: canteen.id },
        _count: true,
        orderBy: { rating: 'desc' }
      })
    ]);

    // Calculate rating distribution with percentages
    const totalReviews = reviewStats._count;
    const ratingDistributionWithPercentage = [1, 2, 3, 4, 5].map(rating => {
      const found = ratingDistribution.find(r => r.rating === rating);
      const count = found?._count || 0;
      const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
      return {
        rating,
        count,
        percentage
      };
    }).reverse(); // Show 5 stars first

    const responseData = {
      reviews,
      stats: {
        averageRating: reviewStats._avg.rating || 0,
        totalReviews: totalReviews,
        ratingDistribution: ratingDistributionWithPercentage,
      }
    };

    return NextResponse.json(responseData);

  } catch (error) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create a response to a review (future feature)
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { reviewId, response } = body;

    if (!reviewId || !response) {
      return NextResponse.json({ error: "Review ID and response are required" }, { status: 400 });
    }

    // Get canteen info
    const canteen = await prisma.canteen.findFirst({
      where: { ownerId: userId },
    });

    if (!canteen) {
      return NextResponse.json({ error: "Canteen not found" }, { status: 404 });
    }

    // Verify the review belongs to this canteen
    const review = await prisma.canteenReviews.findFirst({
      where: { 
        id: reviewId,
        canteenId: canteen.id 
      }
    });

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    // For now, we'll just return success as we don't have a response table
    // In the future, you might want to add a CanteenReviewResponse model
    return NextResponse.json({ 
      message: "Response functionality coming soon",
      reviewId,
      response 
    });

  } catch (error) {
    console.error("Error creating review response:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}