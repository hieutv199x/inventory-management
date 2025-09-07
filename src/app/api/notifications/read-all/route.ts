import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getUserWithShopAccess } from "@/lib/auth";

const prisma = new PrismaClient();

export async function PATCH(req: NextRequest) {
    try {
        const { user } = await getUserWithShopAccess(req, prisma);

        // Update all unread notifications for this user
        await prisma.notification.updateMany({
            where: { 
                userId: user.id,
                read: false
            },
            data: { 
                read: true,
                readAt: new Date()
            }
        });

        return NextResponse.json({ success: true });

    } catch (err: any) {
        console.error("Error marking all notifications as read:", err);
        if (err.message === 'Authentication required' || err.message === 'User not found') {
            return NextResponse.json({ error: err.message }, { status: 401 });
        }
        return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}
