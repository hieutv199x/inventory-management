import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getUserWithShopAccess } from "@/lib/auth";

const prisma = new PrismaClient();

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const { user } = await getUserWithShopAccess(req, prisma);
        const notificationId = params.id;

        // Update notification as read
        const notification = await prisma.notification.updateMany({
            where: { 
                id: notificationId,
                userId: user.id // Ensure user owns this notification
            },
            data: { 
                read: true,
                readAt: new Date()
            }
        });

        if (notification.count === 0) {
            return NextResponse.json({ error: "Notification not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true });

    } catch (err: any) {
        console.error("Error marking notification as read:", err);
        if (err.message === 'Authentication required' || err.message === 'User not found') {
            return NextResponse.json({ error: err.message }, { status: 401 });
        }
        return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}
