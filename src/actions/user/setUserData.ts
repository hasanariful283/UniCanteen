// User data management and database operations
import { RoleType } from "@/types/roles";
import prisma from "@/lib/prisma";

export interface UserData {
    userId: string;
    email: string;
    name: string | null;
    phone: string | null; // Add phone field for user contact
    role: RoleType;
    studentId?: string | null;
}

export async function setUserDataToDB(userData: UserData) {
    try {
        const { userId, email, name, phone, role, studentId } = userData;

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (existingUser) {
            console.log(`User with ID ${userId} already exists.`);
            
            // Check if user is delivery person and needs DeliveryPerson record
            if (role === "DELIVERY_PERSON" || existingUser.userRole === "DELIVERY_PERSON") {
                try {
                    const existingDeliveryPerson = await prisma.deliveryPerson.findUnique({
                        where: { userId },
                    });

                    if (!existingDeliveryPerson) {
                        // Create DeliveryPerson record for existing user
                        await prisma.deliveryPerson.create({
                            data: {
                                userId,
                                uiuId: studentId || existingUser.studentId || `DEL-${userId.slice(-8)}`,
                            },
                        });
                        console.log(`DeliveryPerson record created for existing user ${userId}`);
                    }
                } catch (error) {
                    console.error("Error creating DeliveryPerson record for existing user:", error);
                }
            }
            
            return existingUser;
        }

        // Create new user
        const newUser = await prisma.user.create({
            data: {
                id: userId,
                email,
                name,
                phone,
                userRole: role,
                studentId: studentId || null,
            },
        });

        // If user is a delivery person, also create DeliveryPerson record
        if (role === "DELIVERY_PERSON") {
            try {
                // Check if DeliveryPerson already exists
                const existingDeliveryPerson = await prisma.deliveryPerson.findUnique({
                    where: { userId },
                });

                if (!existingDeliveryPerson) {
                    // Create DeliveryPerson record
                    await prisma.deliveryPerson.create({
                        data: {
                            userId,
                            uiuId: studentId || `DEL-${userId.slice(-8)}`, // Use studentId or generate from userId
                        },
                    });
                    console.log(`DeliveryPerson record created for user ${userId}`);
                }
            } catch (error) {
                console.error("Error creating DeliveryPerson record:", error);
                // Don't throw error here to avoid breaking user creation
            }
        }

        console.log(`User with ID ${userId} created successfully.`);
        return newUser;
    } catch (error) {
        console.error("Error setting user data to DB:", error);
        throw error;
    }
}