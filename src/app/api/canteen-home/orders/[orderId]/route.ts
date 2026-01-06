import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET single order details for canteen
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orderId } = await params;

    // Get canteen info
    const canteen = await prisma.canteen.findFirst({
      where: { ownerId: userId },
    });

    if (!canteen) {
      return NextResponse.json({ error: "Canteen not found" }, { status: 404 });
    }

    const order = await prisma.order.findFirst({
      where: { 
        id: orderId,
        foodItems: {
          some: {
            canteenId: canteen.id
          }
        }
      },
      include: {
        foodItems: {
          where: {
            canteenId: canteen.id
          },
          include: {
            food: {
              select: {
                id: true,
                name: true,
                price: true,
                image: true,
                canteenId: true,
              },
            },
            canteen: {
              select: {
                name: true,
              },
            },
          },
        },
        customer: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        deliveryMan: {
          include: {
            user: {
              select: {
                name: true,
                phone: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error("Error fetching order:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH - Update order status and other details
export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ orderId: string }> }
) {
    try {
        const { userId } = await auth();
        
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { orderId } = await params;
        const body = await request.json();
        const { status } = body;

        if (!status) {
            return NextResponse.json({ error: 'Status is required' }, { status: 400 });
        }

        // Get the canteen for this user
        const canteen = await prisma.canteen.findFirst({
            where: { ownerId: userId }
        });

        if (!canteen) {
            return NextResponse.json({ error: 'Canteen not found' }, { status: 404 });
        }

        // Verify that the order has items from this canteen
        const existingOrder = await prisma.order.findFirst({
            where: { 
                id: orderId,
                foodItems: {
                    some: {
                        canteenId: canteen.id
                    }
                }
            }
        });

        if (!existingOrder) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        // Update order status
        const updatedOrder = await prisma.order.update({
            where: { id: orderId },
            data: { status },
            include: {
                foodItems: {
                    where: { canteenId: canteen.id },
                    include: {
                        food: {
                            select: {
                                id: true,
                                name: true,
                                price: true,
                                image: true,
                            }
                        }
                    }
                },
                customer: {
                    include: {
                        user: {
                            select: {
                                name: true,
                                email: true,
                                phone: true,
                            }
                        }
                    }
                }
            }
        });

        // Create notification for status update
        await prisma.notification.create({
            data: {
                recipientId: existingOrder.customerId,
                senderId: userId,
                title: 'Order Status Updated',
                content: `Your order #${orderId.slice(-6)} status has been updated to ${status}`,
                type: 'ORDER_UPDATE',
                orderId: orderId,
            }
        });

        return NextResponse.json({ order: updatedOrder });

    } catch (error) {
        console.error('Error updating order:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}