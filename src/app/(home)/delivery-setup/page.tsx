import { currentUser } from '@clerk/nextjs/server';
import React from 'react';
import prisma from '@/lib/prisma';

const DeliverySetupPage = async () => {
    const user = await currentUser();
    console.log("Current User:", user);

    if (!user) {
        return <div>User not found</div>;
    }

    const userData = {
        id: user.id,
        email: user.emailAddresses[0]?.emailAddress || "",
        name: user.firstName + " " + user.lastName,
        phone: user.phoneNumbers[0]?.phoneNumber || "",
        userRole: "DELIVERY_PERSON" as const,
        studentId: "",
    };
    // console.log("User Data to Set:", userData);

    try {
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { id: user.id },
        });

        if (existingUser) {
            console.log(`User with ID ${user.id} already exists.`);
            
            // Check if user needs DeliveryPerson record
            const existingDeliveryPerson = await prisma.deliveryPerson.findUnique({
                where: { userId: user.id },
            });

            if (!existingDeliveryPerson) {
                // Create DeliveryPerson record for existing user
                await prisma.deliveryPerson.create({
                    data: {
                        userId: user.id,
                        uiuId: userData.studentId || `DEL-${user.id.slice(-8)}`,
                    },
                });
                console.log(`DeliveryPerson record created for existing user ${user.id}`);
            }
        } else {
            // Create new user
            const newUser = await prisma.user.create({
                data: userData,
            });

            // Create DeliveryPerson record
            await prisma.deliveryPerson.create({
                data: {
                    userId: user.id,
                    uiuId: userData.studentId || `DEL-${user.id.slice(-8)}`,
                },
            });

            console.log(`User with ID ${user.id} created successfully.`);
            console.log(`DeliveryPerson record created for user ${user.id}`);
        }
    } catch (error) {
        console.error("Error setting user data to DB:", error);
        return (
            <div className="p-4">
                <h1 className="text-red-600">Error Setting Up Delivery Person</h1>
                <p>There was an error setting up your delivery person account. Please try again.</p>
            </div>
        );
    }

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold text-green-600">Delivery Person Setup Complete</h1>
            <p className="mt-2">Your delivery person account has been set up successfully.</p>
            <div className="mt-4 p-4 bg-gray-100 rounded">
                <h2 className="font-semibold">Account Details:</h2>
                <p><strong>Name:</strong> {userData.name}</p>
                <p><strong>Email:</strong> {userData.email}</p>
                <p><strong>Phone:</strong> {userData.phone}</p>
                <p><strong>Role:</strong> {userData.userRole}</p>
            </div>
        </div>
    );
};

export default DeliverySetupPage;