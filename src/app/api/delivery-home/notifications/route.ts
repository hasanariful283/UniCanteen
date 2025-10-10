import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Get notifications for this user (most recent first)
    const notifications = await prisma.notification.findMany({
      where: { recipientId: userId },
      orderBy: { createdAt: "desc" },
      take: 20, // Limit to 20 most recent notifications
      include: {
        sender: { select: { name: true, email: true } },
        order: { 
          select: { 
            id: true, 
            status: true,
            customer: { include: { user: { select: { name: true } } } },
            foodItems: {
              include: {
                canteen: { select: { name: true } },
                food: { select: { name: true } }
              }
            }
          }
        },
      },
    });

    // Get unread count
    const unreadCount = await prisma.notification.count({
      where: { recipientId: userId, isRead: false },
    });

    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// Mark notification as read
export async function PATCH(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { notificationId, markAllAsRead } = await req.json();

    if (markAllAsRead) {
      // Mark all notifications as read for this user
      await prisma.notification.updateMany({
        where: { recipientId: userId, isRead: false },
        data: { isRead: true },
      });
      return NextResponse.json({ success: true });
    } else if (notificationId) {
      // Mark specific notification as read
      await prisma.notification.update({
        where: { 
          id: notificationId,
          recipientId: userId, // Ensure user can only mark their own notifications
        },
        data: { isRead: true },
      });
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: "notificationId or markAllAsRead required" }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// Create new notification (for testing or system use)
export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { recipientId, type, title, content, orderId } = await req.json();

    if (!recipientId || !type || !title || !content) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const notification = await prisma.notification.create({
      data: {
        recipientId,
        senderId: userId,
        type,
        title,
        content,
        orderId: orderId || null,
      },
      include: {
        sender: { select: { name: true, email: true } },
        order: { select: { id: true, status: true } },
      },
    });

    return NextResponse.json({ notification });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}