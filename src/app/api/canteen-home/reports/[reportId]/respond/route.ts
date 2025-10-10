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
    const { response, status } = await request.json();

    if (!response) {
      return NextResponse.json({ error: "Response is required" }, { status: 400 });
    }

    // Mock response for now
    // In a real implementation, you would:
    // 1. Verify the report belongs to this canteen owner
    // 2. Update the report with response and status
    // 3. Send notification to customer

    console.log(`Responding to report ${reportId}:`, { response, status });

    return NextResponse.json({ 
      message: "Response sent successfully",
      reportId,
      response,
      status: status || 'RESOLVED',
      respondedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error("Respond to Report API Error:", error);
    return NextResponse.json({ error: "Failed to respond to report" }, { status: 500 });
  }
}