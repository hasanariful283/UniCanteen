import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { reportId } = await params;
    const { status } = await request.json();

    if (!status) {
      return NextResponse.json({ error: "Status is required" }, { status: 400 });
    }

    const validStatuses = ['PENDING', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // Mock response for now
    // In a real implementation, you would:
    // 1. Verify the report belongs to this canteen owner
    // 2. Update the report status
    // 3. Send notification to customer if needed

    console.log(`Updating report ${reportId} status to:`, status);

    return NextResponse.json({ 
      message: "Report status updated successfully",
      reportId,
      status,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error("Update Report Status API Error:", error);
    return NextResponse.json({ error: "Failed to update report status" }, { status: 500 });
  }
}