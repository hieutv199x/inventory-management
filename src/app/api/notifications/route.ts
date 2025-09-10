import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getUserWithShopAccess } from "@/lib/auth";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
    try {
        const { user } = await getUserWithShopAccess(req, prisma);
        const { searchParams } = new URL(req.url);
        
        // Pagination parameters
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const offset = (page - 1) * limit;
        
        // Filter parameters
        const type = searchParams.get('type');
        const read = searchParams.get('read');
        const dateFrom = searchParams.get('dateFrom');
        const dateTo = searchParams.get('dateTo');

        // Build where clause
        const where: any = { userId: user.id };

        if (type && type !== 'all') {
            where.type = type;
        }

        if (read !== null && read !== 'all') {
            where.read = read === 'true';
        }

        if (dateFrom || dateTo) {
            where.createdAt = {};
            if (dateFrom) {
                where.createdAt.gte = new Date(dateFrom);
            }
            if (dateTo) {
                where.createdAt.lte = new Date(dateTo + 'T23:59:59');
            }
        }

        // Get total count for pagination
        const totalItems = await prisma.notification.count({ where });
        const totalPages = Math.ceil(totalItems / limit);

        // Get notifications with pagination
        const notifications = await prisma.notification.findMany({
            where,
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
            skip: offset,
            take: limit
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
            success: true,
            notifications: transformedNotifications,
            pagination: {
                currentPage: page,
                totalPages,
                totalItems,
                itemsPerPage: limit,
                hasNext: page < totalPages,
                hasPrev: page > 1
            },
            unreadCount
        });

    } catch (err: any) {
        console.error("Error fetching notifications:", err);
        if (err.message === 'Authentication required' || err.message === 'User not found' || err.message === 'Invalid token' || err.message === 'Token expired') {
            return NextResponse.json({ error: err.message }, { status: 401 });
        }
        return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}
