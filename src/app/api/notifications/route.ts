import { NextRequest, NextResponse } from 'next/server';
import { NotificationService } from '@/lib/notification-service';
import { PrismaClient } from "@prisma/client";
import { getUserWithShopAccess } from "@/lib/auth";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
    try {
        // Use the same auth pattern as product API
        const user = await getUserWithShopAccess(request, prisma);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = user.user.id;
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '20');
        const offset = parseInt(searchParams.get('offset') || '0');

        const notifications = await NotificationService.getUserNotifications(userId, limit, offset);
        const unreadCount = await NotificationService.getUnreadCount(userId);

        return NextResponse.json({
            notifications,
            unreadCount,
            hasMore: notifications.length === limit
        });

    } catch (error) {
        console.error('Error fetching notifications:', error);
        return NextResponse.json(
            { error: 'Failed to fetch notifications' },
            { status: 500 }
        );
    }
}
