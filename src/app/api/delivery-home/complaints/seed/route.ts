import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify the user is a delivery person
    const deliveryPerson = await prisma.deliveryPerson.findUnique({
      where: { userId },
    });

    if (!deliveryPerson) {
      return NextResponse.json({ error: "Not a delivery person" }, { status: 403 });
    }

    // Get some sample customers and canteens for realistic data
    let customers = await prisma.customer.findMany({
      take: 3,
      include: { user: true }
    });
    
    let canteens = await prisma.canteen.findMany({
      take: 3
    });

    // Create sample data if none exists
    if (customers.length === 0) {
      // Create a sample customer
      const sampleUser = await prisma.user.create({
        data: {
          id: "sample_customer_" + Date.now(),
          email: "customer@test.com",
          name: "Sample Customer",
          phone: "+8801111111111",
          userRole: "CUSTOMER",
        }
      });

      const sampleCustomer = await prisma.customer.create({
        data: {
          userId: sampleUser.id,
          uiuId: "CUST001",
        },
        include: { user: true }
      });

      customers = [sampleCustomer];
    }

    if (canteens.length === 0) {
      // Create a sample canteen
      const sampleCanteenOwner = await prisma.user.create({
        data: {
          id: "sample_canteen_owner_" + Date.now(),
          email: "canteen@test.com",
          name: "Sample Canteen Owner",
          phone: "+8802222222222",
          userRole: "CANTEEN_OWNER",
        }
      });

      const sampleCanteen = await prisma.canteen.create({
        data: {
          id: "sample_canteen_" + Date.now(),
          name: "Olympia_Cafe",
          ownerId: sampleCanteenOwner.id,
        }
      });

      canteens = [sampleCanteen];
    }

    // Create sample complaint reports against this delivery person
    const sampleReports = [
      {
        type: 'DELIVERY' as const,
        title: 'Late Delivery - Food Arrived Cold',
        description: 'The order was delivered 45 minutes late and the food was completely cold. Very disappointing service.',
        status: 'PENDING' as const,
        priority: 'HIGH' as const,
        rating: 2,
        customerId: customers[0].userId,
        canteenId: canteens[0].id,
        deliveryPersonId: userId,
      },
      {
        type: 'SERVICE' as const,
        title: 'Rude Behavior from Delivery Person',
        description: 'The delivery person was very rude and impatient when delivering my order. Unprofessional behavior.',
        status: 'IN_PROGRESS' as const,
        priority: 'MEDIUM' as const,
        rating: 1,
        response: 'We are investigating this matter and will take appropriate action. We apologize for the inconvenience.',
        customerId: customers[1].userId,
        canteenId: canteens[1].id,
        deliveryPersonId: userId,
      },
      {
        type: 'DELIVERY' as const,
        title: 'Wrong Location Delivery',
        description: 'Food was delivered to the wrong building. Had to walk 10 minutes to collect my order.',
        status: 'RESOLVED' as const,
        priority: 'MEDIUM' as const,
        rating: 2,
        response: 'Issue has been resolved. We have provided additional training to the delivery person regarding location accuracy.',
        customerId: customers[2].userId,
        canteenId: canteens[2].id,
        deliveryPersonId: userId,
      },
      {
        type: 'HYGIENE' as const,
        title: 'Delivery Person Not Following Safety Protocols',
        description: 'The delivery person was not wearing a mask and did not use hand sanitizer when handling the food.',
        status: 'RESOLVED' as const,
        priority: 'HIGH' as const,
        rating: 2,
        response: 'We have reinforced our safety protocols with all delivery personnel. Thank you for bringing this to our attention.',
        customerId: customers[0].userId,
        canteenId: canteens[0].id,
        deliveryPersonId: userId,
      },
      {
        type: 'SERVICE' as const,
        title: 'Did Not Follow Delivery Instructions',
        description: 'I specifically asked to leave the food at the reception, but the delivery person insisted on coming upstairs.',
        status: 'PENDING' as const,
        priority: 'LOW' as const,
        rating: 3,
        customerId: customers[1].userId,
        canteenId: canteens[1].id,
        deliveryPersonId: userId,
      },
      {
        type: 'DELIVERY' as const,
        title: 'Excellent Service - Thank You!',
        description: 'Fast delivery and very courteous delivery person. Food arrived hot and on time. Great job!',
        status: 'RESOLVED' as const,
        priority: 'LOW' as const,
        rating: 5,
        response: 'Thank you for the positive feedback! We will share this with our delivery team.',
        customerId: customers[2].userId,
        canteenId: canteens[2].id,
        deliveryPersonId: userId,
      }
    ];

    // Create the reports
    const createdReports = await Promise.all(
      sampleReports.map(report => 
        prisma.customerReport.create({
          data: report
        })
      )
    );

    return NextResponse.json({ 
      message: `Created ${createdReports.length} sample reports`,
      reports: createdReports.map(r => ({ id: r.id, title: r.title, type: r.type }))
    });

  } catch (error) {
    console.error('Error creating sample reports:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}