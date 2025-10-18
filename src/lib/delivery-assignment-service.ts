import prisma from "@/lib/prisma";

interface AutoAssignmentJob {
  orderId: string;
  scheduledAt: number;
}

class DeliveryAssignmentService {
  private static instance: DeliveryAssignmentService;
  private pendingJobs: Map<string, NodeJS.Timeout> = new Map();

  static getInstance(): DeliveryAssignmentService {
    if (!DeliveryAssignmentService.instance) {
      DeliveryAssignmentService.instance = new DeliveryAssignmentService();
    }
    return DeliveryAssignmentService.instance;
  }

  /**
   * Schedule automatic delivery assignment for an order
   * @param orderId - The order ID to assign delivery person to
   * @param delayMinutes - Delay in minutes (default: 2 minutes)
   */
  scheduleAutoAssignment(orderId: string, delayMinutes: number = 2): void {
    // Cancel any existing job for this order
    this.cancelAssignment(orderId);

    const delayMs = delayMinutes * 60 * 1000;
    console.log(`📅 Scheduling auto-assignment for order ${orderId} in ${delayMinutes} minutes`);

    const timeoutId = setTimeout(async () => {
      await this.executeAutoAssignment(orderId);
      this.pendingJobs.delete(orderId);
    }, delayMs);

    this.pendingJobs.set(orderId, timeoutId);
  }

  /**
   * Cancel scheduled assignment for an order
   * @param orderId - The order ID to cancel assignment for
   */
  cancelAssignment(orderId: string): void {
    const existingJob = this.pendingJobs.get(orderId);
    if (existingJob) {
      clearTimeout(existingJob);
      this.pendingJobs.delete(orderId);
      console.log(`❌ Cancelled auto-assignment for order ${orderId}`);
    }
  }

  /**
   * Execute the automatic delivery assignment logic
   * @param orderId - The order ID to assign delivery person to
   */
  private async executeAutoAssignment(orderId: string): Promise<void> {
    try {
      console.log(`🚀 Executing auto-assignment for order ${orderId}`);
      
      // Get the order with related data
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          foodItems: {
            include: {
              canteen: true
            }
          },
          customer: {
            include: {
              user: true
            }
          }
        }
      });

      if (!order) {
        console.log(`❌ Order ${orderId} not found`);
        return;
      }

      if (order.assignedTo) {
        console.log(`⚠️ Order ${orderId} already has delivery person assigned`);
        return;
      }

      if (order.status !== "ACCEPTED") {
        console.log(`⚠️ Order ${orderId} status is ${order.status}, expected ACCEPTED`);
        return;
      }

      // Find available delivery persons using the priority algorithm
      const selectedDeliveryPerson = await this.findBestDeliveryPerson();

      if (!selectedDeliveryPerson) {
        console.log(`❌ No available delivery persons for order ${orderId}`);
        await this.notifyNoDeliveryPersonAvailable(order);
        return;
      }

      // Assign the delivery person
      await this.assignDeliveryPerson(order, selectedDeliveryPerson);
      
    } catch (error) {
      console.error(`❌ Error in auto-assignment for order ${orderId}:`, error);
      await this.notifyAssignmentFailed(orderId, error);
    }
  }

  /**
   * Find the best available delivery person using priority algorithm
   */
  private async findBestDeliveryPerson() {
    // Get available delivery persons
    const availableDeliveryPersons = await prisma.deliveryPerson.findMany({
      where: {
        DeliveryProfile: {
          isAvailable: true
        }
      },
      include: {
        DeliveryProfile: true,
        user: {
          select: {
            name: true,
            phone: true
          }
        },
        deliveries: {
          where: {
            status: {
              in: ["ACCEPTED", "IN_PROGRESS", "DELIVERING"]
            }
          }
        }
      }
    });

    if (availableDeliveryPersons.length === 0) {
      return null;
    }

    // Priority algorithm:
    // 1. Available (already filtered)
    // 2. Lowest ongoing orders
    // 3. First-come-first-served (earliest created delivery person)
    const sortedDeliveryPersons = availableDeliveryPersons.sort((a, b) => {
      // Priority 1: Fewer ongoing orders
      const aOngoingOrders = a.deliveries.length;
      const bOngoingOrders = b.deliveries.length;
      
      if (aOngoingOrders !== bOngoingOrders) {
        return aOngoingOrders - bOngoingOrders;
      }
      
      // Priority 2: FCFS (earlier creation date)
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

    return sortedDeliveryPersons[0];
  }

  /**
   * Assign delivery person to order and update status
   */
  private async assignDeliveryPerson(order: any, deliveryPerson: any) {
    console.log(`✅ Assigning ${deliveryPerson.user.name} to order ${order.id} (${deliveryPerson.deliveries.length} ongoing orders)`);

    // Update order with delivery person assignment
    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: { 
        assignedTo: deliveryPerson.userId,
        status: "DELIVERING"
      }
    });

    // Create notifications for all parties
    await this.createAssignmentNotifications(order, deliveryPerson);

    console.log(`✅ Successfully auto-assigned delivery person to order ${order.id}`);
  }

  /**
   * Create notifications for successful assignment
   */
  private async createAssignmentNotifications(order: any, deliveryPerson: any) {
    const notifications = [];

    // Notify delivery person
    notifications.push(
      prisma.notification.create({
        data: {
          recipientId: deliveryPerson.userId,
          senderId: null, // System notification
          title: 'New Delivery Assignment',
          content: `You have been auto-assigned to deliver order #${order.id.slice(-6)}`,
          type: 'ORDER_UPDATE',
          orderId: order.id,
        }
      })
    );

    // Notify customer
    notifications.push(
      prisma.notification.create({
        data: {
          recipientId: order.customerId,
          senderId: null, // System notification
          title: 'Delivery Person Assigned',
          content: `${deliveryPerson.user.name} has been assigned to deliver your order #${order.id.slice(-6)}`,
          type: 'ORDER_UPDATE',
          orderId: order.id,
        }
      })
    );

    // Notify all canteen owners involved in this order
    const canteenIds = [...new Set(order.foodItems.map((item: any) => item.canteen.ownerId))];
    for (const ownerId of canteenIds) {
      if (typeof ownerId === 'string') {
        notifications.push(
          prisma.notification.create({
            data: {
              recipientId: ownerId,
              senderId: null, // System notification
              title: 'Delivery Person Auto-Assigned',
              content: `${deliveryPerson.user.name} has been auto-assigned to deliver order #${order.id.slice(-6)}`,
              type: 'ORDER_UPDATE',
              orderId: order.id,
            }
          })
        );
      }
    }

    await Promise.all(notifications);
  }

  /**
   * Notify about no delivery person available
   */
  private async notifyNoDeliveryPersonAvailable(order: any) {
    const canteenIds = [...new Set(order.foodItems.map((item: any) => item.canteen.ownerId))];
    
    for (const ownerId of canteenIds) {
      if (typeof ownerId === 'string') {
        await prisma.notification.create({
          data: {
            recipientId: ownerId,
            senderId: null, // System notification
            title: 'No Delivery Person Available',
            content: `Order #${order.id.slice(-6)} could not be auto-assigned. Please manually assign a delivery person.`,
            type: 'ORDER_UPDATE',
            orderId: order.id,
          }
        });
      }
    }
  }

  /**
   * Notify about assignment failure
   */
  private async notifyAssignmentFailed(orderId: string, error: any) {
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          foodItems: {
            include: {
              canteen: true
            }
          }
        }
      });
      
      if (order) {
        const canteenIds = [...new Set(order.foodItems.map((item: any) => item.canteen.ownerId))];
        for (const ownerId of canteenIds) {
          if (typeof ownerId === 'string') {
            await prisma.notification.create({
              data: {
                recipientId: ownerId,
                senderId: null, // System notification
                title: 'Auto-Assignment Failed',
                content: `Failed to auto-assign delivery person for order #${orderId.slice(-6)}. Please manually assign.`,
                type: 'ORDER_UPDATE',
                orderId: orderId,
              }
            });
          }
        }
      }
    } catch (notificationError) {
      console.error("Failed to send failure notification:", notificationError);
    }
  }

  /**
   * Get pending jobs count (for monitoring)
   */
  getPendingJobsCount(): number {
    return this.pendingJobs.size;
  }

  /**
   * Get pending jobs (for monitoring)
   */
  getPendingJobs(): string[] {
    return Array.from(this.pendingJobs.keys());
  }
}

export default DeliveryAssignmentService;