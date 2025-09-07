import { NextRequest, NextResponse } from 'next/server';
import { NotificationService } from '@/lib/notification-service';
import { PrismaClient } from "@prisma/client";
import { getUserWithShopAccess } from "@/lib/auth";

const prisma = new PrismaClient();

export async function PATCH(request: NextRequest) {
    try {
        // Use the same auth pattern as product API
        const user = await getUserWithShopAccess(request, prisma);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = user.user.id;
        const result = await NotificationService.markAllAsRead(userId);

        return NextResponse.json({ 
            success: true, 
            updatedCount: result.count 
        });

    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        return NextResponse.json(
            { error: 'Failed to mark all notifications as read' },
            { status: 500 }
        );
    }
}
