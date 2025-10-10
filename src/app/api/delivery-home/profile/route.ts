import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const { userId } = await auth();
        
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        let profile = await prisma.deliveryProfile.findUnique({
            where: { userId },
            include: {
                timeSlots: true,
            },
        });

        // If no profile exists, create a default one
        if (!profile) {
            profile = await prisma.deliveryProfile.create({
                data: {
                    userId,
                    isAvailable: false,
                    orderNotifications: true,
                    messageNotifications: true,
                    earningsNotifications: false,
                    promotionNotifications: false,
                    soundEnabled: true,
                    showPhoneToCustomers: true,
                    showLocationWhenOnline: true,
                    allowCustomerRatings: true,
                    language: 'en',
                    theme: 'light',
                    defaultStartTime: '09:00',
                    defaultEndTime: '22:00',
                },
                include: {
                    timeSlots: true,
                },
            });
        }

        return NextResponse.json({
            profile: {
                phone: profile.phone,
                address: profile.address,
                vehicleType: profile.vehicleType,
                isAvailable: profile.isAvailable,
                orderNotifications: profile.orderNotifications,
                messageNotifications: profile.messageNotifications,
                earningsNotifications: profile.earningsNotifications,
                promotionNotifications: profile.promotionNotifications,
                soundEnabled: profile.soundEnabled,
                showPhoneToCustomers: profile.showPhoneToCustomers,
                showLocationWhenOnline: profile.showLocationWhenOnline,
                allowCustomerRatings: profile.allowCustomerRatings,
                language: profile.language,
                theme: profile.theme,
                defaultStartTime: profile.defaultStartTime,
                defaultEndTime: profile.defaultEndTime,
            },
            timeSlots: profile.timeSlots.map((slot: any) => ({
                id: slot.id,
                dayOfWeek: slot.dayOfWeek,
                startTime: slot.startTime,
                endTime: slot.endTime,
                isActive: slot.isActive,
            })),
        });
    } catch (error) {
        console.error('Error fetching delivery profile:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { userId } = await auth();
        
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { profile, timeSlots } = await request.json();

        // Prepare data for upsert (filter out undefined values)
        const profileData: any = {};
        if (profile.phone !== undefined) profileData.phone = profile.phone;
        if (profile.address !== undefined) profileData.address = profile.address;
        if (profile.vehicleType !== undefined) profileData.vehicleType = profile.vehicleType;
        if (profile.isAvailable !== undefined) profileData.isAvailable = profile.isAvailable;
        if (profile.orderNotifications !== undefined) profileData.orderNotifications = profile.orderNotifications;
        if (profile.messageNotifications !== undefined) profileData.messageNotifications = profile.messageNotifications;
        if (profile.earningsNotifications !== undefined) profileData.earningsNotifications = profile.earningsNotifications;
        if (profile.promotionNotifications !== undefined) profileData.promotionNotifications = profile.promotionNotifications;
        if (profile.soundEnabled !== undefined) profileData.soundEnabled = profile.soundEnabled;
        if (profile.showPhoneToCustomers !== undefined) profileData.showPhoneToCustomers = profile.showPhoneToCustomers;
        if (profile.showLocationWhenOnline !== undefined) profileData.showLocationWhenOnline = profile.showLocationWhenOnline;
        if (profile.allowCustomerRatings !== undefined) profileData.allowCustomerRatings = profile.allowCustomerRatings;
        if (profile.language !== undefined) profileData.language = profile.language;
        if (profile.theme !== undefined) profileData.theme = profile.theme;
        if (profile.defaultStartTime !== undefined) profileData.defaultStartTime = profile.defaultStartTime;
        if (profile.defaultEndTime !== undefined) profileData.defaultEndTime = profile.defaultEndTime;

        // Upsert the delivery profile
        const deliveryProfile = await prisma.deliveryProfile.upsert({
            where: { userId },
            create: {
                userId,
                phone: profile.phone || null,
                address: profile.address || null,
                vehicleType: profile.vehicleType || null,
                isAvailable: profile.isAvailable ?? false,
                orderNotifications: profile.orderNotifications ?? true,
                messageNotifications: profile.messageNotifications ?? true,
                earningsNotifications: profile.earningsNotifications ?? false,
                promotionNotifications: profile.promotionNotifications ?? false,
                soundEnabled: profile.soundEnabled ?? true,
                showPhoneToCustomers: profile.showPhoneToCustomers ?? true,
                showLocationWhenOnline: profile.showLocationWhenOnline ?? true,
                allowCustomerRatings: profile.allowCustomerRatings ?? true,
                language: profile.language || 'en',
                theme: profile.theme || 'light',
                defaultStartTime: profile.defaultStartTime || '09:00',
                defaultEndTime: profile.defaultEndTime || '22:00',
            },
            update: profileData,
        });

        // Update time slots only if provided
        if (timeSlots && Array.isArray(timeSlots) && timeSlots.length > 0) {
            // Delete existing time slots and create new ones
            await prisma.deliveryTimeSlot.deleteMany({
                where: { deliveryId: deliveryProfile.id },
            });

            await prisma.deliveryTimeSlot.createMany({
                data: timeSlots.map((slot: any) => ({
                    deliveryId: deliveryProfile.id,
                    dayOfWeek: slot.dayOfWeek,
                    startTime: slot.startTime,
                    endTime: slot.endTime,
                    isActive: slot.isActive,
                })),
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error saving delivery profile:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}