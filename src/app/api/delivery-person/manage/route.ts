import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createMissingDeliveryPersonRecords, ensureDeliveryPersonRecord } from "@/actions/user/ensureDeliveryPerson";

export async function POST(request: Request) {
    try {
        const { userId } = await auth();
        
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { action, targetUserId, uiuId } = body;

        if (action === "create-missing") {
            // Create all missing DeliveryPerson records
            const result = await createMissingDeliveryPersonRecords();
            return NextResponse.json(result);
        } else if (action === "ensure-single" && targetUserId) {
            // Ensure single user has DeliveryPerson record
            const result = await ensureDeliveryPersonRecord(targetUserId, uiuId);
            return NextResponse.json({
                success: true,
                deliveryPerson: result,
                message: result ? "DeliveryPerson record ensured" : "User is not a delivery person"
            });
        } else {
            return NextResponse.json({ error: "Invalid action or missing parameters" }, { status: 400 });
        }
    } catch (error) {
        console.error("Error in delivery person management:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

export async function GET() {
    try {
        const { userId } = await auth();
        
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get current user's DeliveryPerson record if exists
        const result = await ensureDeliveryPersonRecord(userId);
        
        return NextResponse.json({
            success: true,
            deliveryPerson: result,
            hasDeliveryRecord: !!result
        });
    } catch (error) {
        console.error("Error checking delivery person record:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}