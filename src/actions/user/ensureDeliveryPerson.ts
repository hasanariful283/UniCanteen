import prisma from "@/lib/prisma";

export async function ensureDeliveryPersonRecord(userId: string, uiuId?: string) {
    try {
        // Check if user exists and is a delivery person
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new Error(`User with ID ${userId} not found`);
        }

        if (user.userRole !== "DELIVERY_PERSON") {
            console.log(`User ${userId} is not a delivery person. Role: ${user.userRole}`);
            return null;
        }

        // Check if DeliveryPerson record already exists
        const existingDeliveryPerson = await prisma.deliveryPerson.findUnique({
            where: { userId },
        });

        if (existingDeliveryPerson) {
            console.log(`DeliveryPerson record already exists for user ${userId}`);
            return existingDeliveryPerson;
        }

        // Create DeliveryPerson record
        const deliveryPerson = await prisma.deliveryPerson.create({
            data: {
                userId,
                uiuId: uiuId || user.studentId || `DEL-${userId.slice(-8)}`,
            },
        });

        console.log(`DeliveryPerson record created for user ${userId}`);
        return deliveryPerson;
    } catch (error) {
        console.error("Error ensuring DeliveryPerson record:", error);
        throw error;
    }
}

/**
 * Batch function to create missing DeliveryPerson records for all users with DELIVERY_PERSON role
 */
export async function createMissingDeliveryPersonRecords() {
    try {
        // Find all users with DELIVERY_PERSON role
        const deliveryUsers = await prisma.user.findMany({
            where: {
                userRole: "DELIVERY_PERSON",
            },
            include: {
                DeliveryPerson: true,
            },
        });

        console.log(`Found ${deliveryUsers.length} users with DELIVERY_PERSON role`);

        // Filter users without DeliveryPerson records
        const usersWithoutDeliveryRecord = deliveryUsers.filter(user => !user.DeliveryPerson);
        
        console.log(`${usersWithoutDeliveryRecord.length} users need DeliveryPerson records`);

        if (usersWithoutDeliveryRecord.length === 0) {
            return { created: 0, message: "All delivery users already have DeliveryPerson records" };
        }

        // Create DeliveryPerson records
        const createdRecords = [];
        for (const user of usersWithoutDeliveryRecord) {
            try {
                const deliveryPerson = await prisma.deliveryPerson.create({
                    data: {
                        userId: user.id,
                        uiuId: user.studentId || `DEL-${user.id.slice(-8)}`,
                    },
                });
                createdRecords.push(deliveryPerson);
                console.log(`Created DeliveryPerson record for user ${user.id}`);
            } catch (error) {
                console.error(`Failed to create DeliveryPerson record for user ${user.id}:`, error);
            }
        }

        return {
            created: createdRecords.length,
            message: `Successfully created ${createdRecords.length} DeliveryPerson records`,
            records: createdRecords,
        };
    } catch (error) {
        console.error("Error creating missing DeliveryPerson records:", error);
        throw error;
    }
}