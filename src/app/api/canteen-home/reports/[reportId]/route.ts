import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { reportId } = await params;
    const body = await request.json();
    const { status, response } = body;

    // Verify the report belongs to a canteen owned by this user
    const report = await prisma.customerReport.findFirst({
      where: {
        id: reportId,
        canteen: {
          ownerId: userId
        }
      }
    });

    if (!report) {
      return NextResponse.json({ 
        error: "Report not found or unauthorized" 
      }, { status: 404 });
    }

    // Update the report
    const updatedReport = await prisma.customerReport.update({
      where: { id: reportId },
      data: {
        ...(status && { status }),
        ...(response && { response }),
      },
      include: {
        customer: {
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        },
        order: {
          select: {
            id: true,
            createdAt: true
          }
        },
        foodItem: {
          include: {
            food: {
              select: {
                name: true
              }
            }
          }
        },
        canteen: {
          select: {
            name: true
          }
        }
      }
    });

    return NextResponse.json({ report: updatedReport });
  } catch (error) {
    console.error("Update Report API Error:", error);
    return NextResponse.json({ error: "Failed to update report" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { reportId } = await params;

    // Verify the report belongs to a canteen owned by this user
    const report = await prisma.customerReport.findFirst({
      where: {
        id: reportId,
        canteen: {
          ownerId: userId
        }
      }
    });

    if (!report) {
      return NextResponse.json({ 
        error: "Report not found or unauthorized" 
      }, { status: 404 });
    }

    // Delete the report
    await prisma.customerReport.delete({
      where: { id: reportId }
    });

    return NextResponse.json({ message: "Report deleted successfully" });
  } catch (error) {
    console.error("Delete Report API Error:", error);
    return NextResponse.json({ error: "Failed to delete report" }, { status: 500 });
  }
}