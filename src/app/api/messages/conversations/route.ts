import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function GET(_req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const convos = await prisma.conversation.findMany({
      where: {
        participants: {
          some: { userId },
        },
      },
      orderBy: { updatedAt: "desc" },
      include: {
        participants: { include: { user: true } },
        messages: { take: 1, orderBy: { createdAt: "desc" } },
        _count: { select: { messages: true } },
      },
    });
    return NextResponse.json({ conversations: convos });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { participantIds, orderId } = body as { participantIds?: string[]; orderId?: string | null };

    let finalParticipantIds: string[] = [];

    if (orderId && (!participantIds || participantIds.length === 0)) {
      // Infer participants from the order (customer, canteen owners involved, and assigned delivery person)
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          foodItems: { include: { canteen: { include: { owner: true } } } },
          deliveryMan: true,
        },
      });

      if (!order) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }

      // Access control: requester must be the customer, an involved canteen owner, or the assigned delivery person
      const canteenOwnerIds = Array.from(
        new Set(order.foodItems.map((fi) => fi.canteen.ownerId))
      );
      const deliveryUserId = order.assignedTo ?? null;
      const eligibleIds = new Set<string>([order.customerId, ...canteenOwnerIds]);
      if (deliveryUserId) eligibleIds.add(deliveryUserId);

      if (!eligibleIds.has(userId)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      finalParticipantIds = Array.from(eligibleIds);
    } else {
      // Validate explicit participantIds
      if (!participantIds || !Array.isArray(participantIds) || participantIds.length === 0) {
        return NextResponse.json({ error: "participantIds must be a non-empty array or provide orderId" }, { status: 400 });
      }
      finalParticipantIds = Array.from(new Set(participantIds));
      // Ensure current user is included
      if (!finalParticipantIds.includes(userId)) finalParticipantIds.push(userId);
    }

    // Safety limit
    if (finalParticipantIds.length > 10) {
      return NextResponse.json({ error: "Too many participants" }, { status: 400 });
    }

    // If orderId provided, reuse or create conversation for that order and ensure all participants are present
    if (orderId) {
      let convo = await prisma.conversation.findFirst({ where: { orderId }, include: { participants: true } });
      if (!convo) {
        convo = await prisma.conversation.create({
          data: {
            orderId,
            participants: { create: finalParticipantIds.map((pid) => ({ userId: pid })) },
          },
          include: { participants: { include: { user: true } } },
        });
      } else {
        // Add any missing participants
        const existing = new Set(convo.participants.map((p) => p.userId));
        const toAdd = finalParticipantIds.filter((pid) => !existing.has(pid));
        if (toAdd.length > 0) {
          await prisma.conversationParticipant.createMany({
            data: toAdd.map((pid) => ({ conversationId: convo!.id, userId: pid })),
            skipDuplicates: true,
          });
        }
        // Reload with user details
        convo = await prisma.conversation.findUnique({
          where: { id: convo.id },
          include: { participants: { include: { user: true } } },
        });
      }
      return NextResponse.json({ conversation: convo }, { status: 201 });
    }

    // Otherwise, create a general conversation
    const conversation = await prisma.conversation.create({
      data: {
        orderId: null,
        participants: { create: finalParticipantIds.map((pid) => ({ userId: pid })) },
      },
      include: { participants: { include: { user: true } } },
    });
    return NextResponse.json({ conversation }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
