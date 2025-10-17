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

    // Get user and customer info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        Customer: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get recent orders count for additional context
    const ordersCount = user.Customer ? await prisma.order.count({
      where: { customerId: user.Customer.userId }
    }) : 0;

    // Get unread notifications count
    const unreadNotifications = await prisma.notification.count({
      where: { 
        recipientId: userId,
        isRead: false 
      }
    });

    // Build settings object with default values
    const settings = {
      // Personal Information
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      uiuId: user.Customer?.uiuId || '',
      studentId: user.studentId || '',
      
      // Account Stats
      totalOrders: ordersCount,
      unreadNotifications,
      accountCreated: user.createdAt,
      lastUpdated: user.updatedAt,
      
      // Notification Preferences (default values - these could be extended in schema)
      orderNotifications: true,
      promotionNotifications: false,
      messageNotifications: true,
      emailNotifications: true,
      
      // Privacy Settings (default values)
      showPhoneToDelivery: true,
      allowRatings: true,
      
      // App Preferences (default values)
      theme: 'light',
      language: 'en',
      soundEnabled: true,
      
      // Additional info
      hasCustomerProfile: !!user.Customer,
      userRole: user.userRole,
    };

    return NextResponse.json(settings);

  } catch (error) {
    console.error("Error fetching customer settings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      email,
      phone,
      uiuId,
      studentId,
      orderNotifications,
      promotionNotifications,
      messageNotifications,
      emailNotifications,
      showPhoneToDelivery,
      allowRatings,
      theme,
      language,
      soundEnabled,
    } = body;

    // Validation
    if (uiuId && (uiuId.length < 6 || uiuId.length > 15)) {
      return NextResponse.json(
        { error: "UIU ID must be between 6 and 15 characters" },
        { status: 400 }
      );
    }

    if (phone && !/^(\+88)?01[3-9]\d{8}$/.test(phone.replace(/\s+/g, ''))) {
      return NextResponse.json(
        { error: "Please enter a valid Bangladeshi phone number" },
        { status: 400 }
      );
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address" },
        { status: 400 }
      );
    }

    // Use transaction to update multiple records
    const result = await prisma.$transaction(async (tx) => {
      // Update user information
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          name: name || undefined,
          email: email || undefined,
          phone: phone || undefined,
          studentId: studentId || undefined,
        }
      });

      // Update or create customer record if uiuId is provided
      let customerRecord = null;
      if (uiuId) {
        try {
          customerRecord = await tx.customer.upsert({
            where: { userId },
            update: { uiuId },
            create: {
              userId,
              uiuId,
            }
          });
        } catch (error) {
          // Check if it's a unique constraint error for uiuId
          if (error instanceof Error && error.message.includes('uiuId')) {
            throw new Error('UIU ID already exists');
          }
          throw error;
        }
      }

      return { updatedUser, customerRecord };
    });

    // For now, we'll store preferences in memory/response
    // In a production app, you might want to create a CustomerProfile model
    const responseData = {
      name: result.updatedUser.name,
      email: result.updatedUser.email,
      phone: result.updatedUser.phone,
      studentId: result.updatedUser.studentId,
      uiuId: result.customerRecord?.uiuId || uiuId,
      orderNotifications,
      promotionNotifications,
      messageNotifications,
      emailNotifications,
      showPhoneToDelivery,
      allowRatings,
      theme,
      language,
      soundEnabled,
      lastUpdated: new Date().toISOString(),
    };

    return NextResponse.json({
      message: "Settings updated successfully",
      settings: responseData
    });

  } catch (error) {
    console.error("Error updating customer settings:", error);
    
    // Handle specific errors
    if (error instanceof Error) {
      if (error.message.includes('UIU ID already exists')) {
        return NextResponse.json(
          { error: "This UIU ID is already registered by another user" },
          { status: 400 }
        );
      }
      if (error.message.includes('Unique constraint failed')) {
        return NextResponse.json(
          { error: "Some information already exists in the system" },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}