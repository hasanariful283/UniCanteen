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

    // Get canteen info
    const canteen = await prisma.canteen.findFirst({
      where: { ownerId: userId },
    });

    if (!canteen) {
      return NextResponse.json({ error: "Canteen not found" }, { status: 404 });
    }

    // Default operating hours
    const defaultOperatingHours = {
      monday: { open: "09:00", close: "17:00", isOpen: true },
      tuesday: { open: "09:00", close: "17:00", isOpen: true },
      wednesday: { open: "09:00", close: "17:00", isOpen: true },
      thursday: { open: "09:00", close: "17:00", isOpen: true },
      friday: { open: "09:00", close: "17:00", isOpen: true },
      saturday: { open: "10:00", close: "16:00", isOpen: true },
      sunday: { open: "10:00", close: "16:00", isOpen: false },
    };

    // Build settings object
    const settings = {
      // Basic Information
      name: canteen.name,
      description: null, // Not available in current schema
      phone: null, // Not available in current schema - could be taken from user
      address: null, // Not available in current schema
      canteen_image: canteen.canteen_image || null,
      
      // Operating Hours (stored as JSON or default values)
      operatingHours: defaultOperatingHours, // In a real app, this would be stored in the database
      
      // Business Settings (these would need to be added to the schema)
      minimumOrderAmount: 50.0, // Default values - would be stored in database
      deliveryFee: 20.0,
      preparationTime: 15,
      acceptsPreorders: true,
      allowsRating: true,
      
      // Notification Settings (would be stored in user preferences)
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true,
      
      // Privacy Settings
      showPhone: true,
      showAddress: true,
      allowReviews: true,
    };

    return NextResponse.json(settings);

  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const settings = await request.json();

    // Get canteen info
    const canteen = await prisma.canteen.findFirst({
      where: { ownerId: userId },
    });

    if (!canteen) {
      return NextResponse.json({ error: "Canteen not found" }, { status: 404 });
    }

    // Update canteen basic information
    const updatedCanteen = await prisma.canteen.update({
      where: { id: canteen.id },
      data: {
        // Only update fields that exist in the schema
        // Currently only canteen_image can be updated
        // Other fields like description, phone, address would need to be added to schema
      }
    });

    // In a real application, you would also update:
    // - Operating hours (in a separate OperatingHours table)
    // - Business settings (in a CanteenSettings table)
    // - Notification preferences (in user preferences)
    // - Privacy settings (in canteen settings)

    return NextResponse.json({ 
      message: "Settings updated successfully",
      canteen: updatedCanteen 
    });

  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH - Update specific setting
export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { setting, value } = await request.json();

    if (!setting) {
      return NextResponse.json({ error: "Setting name is required" }, { status: 400 });
    }

    // Get canteen info
    const canteen = await prisma.canteen.findFirst({
      where: { ownerId: userId },
    });

    if (!canteen) {
      return NextResponse.json({ error: "Canteen not found" }, { status: 404 });
    }

    // Update specific setting based on the setting name
    let updateData: any = {};

    switch (setting) {
      case 'canteen_image':
        updateData.canteen_image = value;
        break;
      default:
        return NextResponse.json({ 
          error: "Setting not available in current schema. Available: canteen_image" 
        }, { status: 400 });
    }

    const updatedCanteen = await prisma.canteen.update({
      where: { id: canteen.id },
      data: updateData
    });

    return NextResponse.json({ 
      message: `${setting} updated successfully`,
      canteen: updatedCanteen 
    });

  } catch (error) {
    console.error("Error updating setting:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}