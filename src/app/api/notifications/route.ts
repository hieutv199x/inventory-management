import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getUserWithShopAccess } from "@/lib/auth";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
    try {
        const { user } = await getUserWithShopAccess(req, prisma);
        const { searchParams } = new URL(req.url);
        const limit = parseInt(searchParams.get('limit') || '10');
        const offset = parseInt(searchParams.get('offset') || '0');

        // Get notifications for the user
        const notifications = await prisma.notification.findMany({
            where: { userId: user.id },
            include: {
                order: {
                    select: {
                        orderId: true,
                        status: true,
                        totalAmount: true,
                        currency: true
                    }
                },
                shop: {
                    select: {
                        shopName: true,
                        shopId: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
            skip: offset
        });

        // Get unread count
        const unreadCount = await prisma.notification.count({
            where: { 
                userId: user.id,
                read: false 
            }
        });

        // Transform notifications for the response
        const transformedNotifications = notifications.map(notification => ({
            id: notification.id,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            read: notification.read,
            createdAt: notification.createdAt.toISOString(),
            data: notification.data,
            order: notification.order ? {
                orderId: notification.order.orderId,
                status: notification.order.status,
                totalAmount: notification.order.totalAmount,
                currency: notification.order.currency
            } : undefined,
            shop: notification.shop ? {
                shopName: notification.shop.shopName,
                shopId: notification.shop.shopId
            } : undefined
        }));

        return NextResponse.json({
            notifications: transformedNotifications,
            unreadCount,
            hasMore: notifications.length === limit
        });

    } catch (err: any) {
        console.error("Error fetching notifications:", err);
        if (err.message === 'Authentication required' || err.message === 'User not found') {
            return NextResponse.json({ error: err.message }, { status: 401 });
        }
        return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}
