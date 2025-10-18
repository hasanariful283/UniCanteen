"use server";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import DeliveryAssignmentService from "@/lib/delivery-assignment-service";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const assignmentService = DeliveryAssignmentService.getInstance();
    
    return NextResponse.json({
      pendingJobs: assignmentService.getPendingJobsCount(),
      pendingOrderIds: assignmentService.getPendingJobs(),
      status: "active"
    });

  } catch (error) {
    console.error("Error getting assignment service status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}