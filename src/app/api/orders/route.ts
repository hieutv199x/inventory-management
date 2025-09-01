import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getUserWithShopAccess, getActiveShopIds, validateShopAccess } from "@/lib/auth";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
    try {
        const { user, isAdmin, accessibleShopIds } = await getUserWithShopAccess(request, prisma);

        const { searchParams } = new URL(request.url);
        const channel = searchParams.get('channel');
        const requestedShopId = searchParams.get('shopId');
        const status = searchParams.get('status');
        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = parseInt(searchParams.get('offset') || '0');

        // Get active shop IDs
        const activeShopIds = await getActiveShopIds(prisma);

        // Validate shop access
        const { shopFilter, hasAccess } = validateShopAccess(
            requestedShopId,
            isAdmin,
            accessibleShopIds,
            activeShopIds
        );

        if (!hasAccess) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        const where: any = {};
        
        // Apply shop filter based on user permissions
        if (shopFilter) {
            where.shopId = shopFilter;
        }

        if (channel) {
            where.channel = channel as any;
        }
        if (status) {
            where.status = status;
        }
        
        const [orders, total] = await Promise.all([
            prisma.order.findMany({
                where,
                include: {
                    shop: {
                        select: {
                            shopName: true,
                            app: {
                                select: {
                                    channel: true,
                                    appName: true
                                }
                            }
                        }
                    },
                    lineItems: true,
                    payment: true,
                    recipientAddress: true
                },
                take: limit,
                skip: offset,
                orderBy: { createdAt: 'desc' }
            }),
            prisma.order.count({ where })
        ]);

        return NextResponse.json({ 
            orders: orders.map(order => ({
                ...order,
                channelData: order.channelData ? JSON.parse(order.channelData) : null,
                lineItems: order.lineItems.map(item => ({
                    ...item,
                    channelData: item.channelData ? JSON.parse(item.channelData) : null
                }))
            })),
            total,
            hasMore: offset + limit < total
        });
    } catch (error) {
        console.error('Error fetching orders:', error);
        if (error instanceof Error && error.message === 'Authentication required') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}