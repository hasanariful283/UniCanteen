// Canteen dashboard analytics with revenue, orders, and performance metrics
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const { userId } = await auth();
        
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get the canteen for this user
        const canteen = await prisma.canteen.findFirst({
            where: { ownerId: userId }
        });

        if (!canteen) {
            return NextResponse.json({ error: 'Canteen not found' }, { status: 404 });
        }

        // Get comprehensive stats
        const [
            totalFoodItems,
            availableFoodItems,
            totalOrders,
            pendingOrders,
            completedOrders,
            totalRevenue,
            todayOrders,
            todayRevenue,
            lowStockItems,
            topSellingItems,
            recentOrders,
            totalReviews,
            averageRating
        ] = await Promise.all([
            // Total food items
            prisma.canteenFood.count({
                where: { canteenId: canteen.id }
            }),
            
            // Available food items
            prisma.canteenFood.count({
                where: { 
                    canteenId: canteen.id,
                    availability: true 
                }
            }),
            
            // Total orders
            prisma.orderFoodItem.count({
                where: { canteenId: canteen.id }
            }),
            
            // Pending orders
            prisma.order.count({
                where: {
                    status: 'PENDING',
                    foodItems: {
                        some: { canteenId: canteen.id }
                    }
                }
            }),
            
            // Completed orders
            prisma.order.count({
                where: {
                    status: 'DELIVERED',
                    foodItems: {
                        some: { canteenId: canteen.id }
                    }
                }
            }),
            
            // Total revenue (from completed orders)
            prisma.orderFoodItem.aggregate({
                where: {
                    canteenId: canteen.id,
                    order: { status: 'DELIVERED' }
                },
                _sum: {
                    quantity: true
                }
            }).then(async (result) => {
                const items = await prisma.orderFoodItem.findMany({
                    where: {
                        canteenId: canteen.id,
                        order: { status: 'DELIVERED' }
                    },
                    include: { food: true }
                });
                return items.reduce((total, item) => total + (item.food.price * item.quantity), 0);
            }),
            
            // Today's orders
            prisma.order.count({
                where: {
                    createdAt: {
                        gte: new Date(new Date().setHours(0, 0, 0, 0))
                    },
                    foodItems: {
                        some: { canteenId: canteen.id }
                    }
                }
            }),
            
            // Today's revenue
            prisma.orderFoodItem.findMany({
                where: {
                    canteenId: canteen.id,
                    createdAt: {
                        gte: new Date(new Date().setHours(0, 0, 0, 0))
                    },
                    order: { status: 'DELIVERED' }
                },
                include: { food: true }
            }).then(items => 
                items.reduce((total, item) => total + (item.food.price * item.quantity), 0)
            ),
            
            // Low stock items (stock < 5)
            prisma.canteenFood.findMany({
                where: {
                    canteenId: canteen.id,
                    stocks: { lt: 5 }
                },
                select: {
                    id: true,
                    name: true,
                    stocks: true
                }
            }),
            
            // Top selling items
            prisma.orderFoodItem.groupBy({
                by: ['foodId'],
                where: {
                    canteenId: canteen.id,
                    order: { status: 'DELIVERED' }
                },
                _sum: {
                    quantity: true
                },
                _count: {
                    foodId: true
                },
                orderBy: {
                    _sum: {
                        quantity: 'desc'
                    }
                },
                take: 5
            }).then(async (items) => {
                const foodIds = items.map(item => item.foodId);
                const foods = await prisma.canteenFood.findMany({
                    where: { id: { in: foodIds } },
                    select: { id: true, name: true, price: true, image: true }
                });
                
                return items.map(item => ({
                    ...foods.find(f => f.id === item.foodId),
                    totalSold: item._sum.quantity,
                    orderCount: item._count.foodId
                }));
            }),
            
            // Recent orders
            prisma.order.findMany({
                where: {
                    foodItems: {
                        some: { canteenId: canteen.id }
                    }
                },
                include: {
                    customer: {
                        include: {
                            user: {
                                select: { name: true, email: true }
                            }
                        }
                    },
                    foodItems: {
                        where: { canteenId: canteen.id },
                        include: {
                            food: {
                                select: { name: true, price: true }
                            }
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
                take: 10
            }),
            
            // Total reviews
            prisma.canteenReviews.count({
                where: { canteenId: canteen.id }
            }),
            
            // Average rating
            prisma.canteenReviews.aggregate({
                where: { canteenId: canteen.id },
                _avg: { rating: true }
            }).then(result => result._avg.rating || 0)
        ]);

        return NextResponse.json({
            canteenId: canteen.id,
            canteenName: canteen.name,
            stats: {
                totalFoodItems,
                availableFoodItems,
                totalOrders,
                pendingOrders,
                completedOrders,
                totalRevenue: Math.round(totalRevenue * 100) / 100,
                todayOrders,
                todayRevenue: Math.round(todayRevenue * 100) / 100,
                totalReviews,
                averageRating: Math.round((averageRating || 0) * 10) / 10
            },
            lowStockItems,
            topSellingItems,
            recentOrders: recentOrders.map(order => ({
                id: order.id,
                customerName: order.customer.user?.name || 'Unknown',
                items: order.foodItems.map(item => ({
                    name: item.food.name,
                    quantity: item.quantity,
                    price: item.food.price
                })),
                totalPrice: order.totalPrice,
                status: order.status,
                createdAt: order.createdAt
            }))
        });
    } catch (error) {
        console.error('Error fetching canteen dashboard stats:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}