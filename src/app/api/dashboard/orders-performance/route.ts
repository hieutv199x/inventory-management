import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getUserWithShopAccess } from "@/lib/auth";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const days = parseInt(searchParams.get('days') || '30');
        const shopId = searchParams.get('shopId');

        const { user, accessibleShopIds, isAdmin } = await getUserWithShopAccess(req, prisma);

        // Build shop filter
        let shopFilter = {};
        if (!isAdmin) {
            shopFilter = { shopId: { in: accessibleShopIds } };
        }
        if (shopId && (isAdmin || accessibleShopIds.includes(shopId))) {
            shopFilter = { shopId };
        }

        // Date range filter (last N days)
        const startTime = Math.floor((Date.now() - (days * 24 * 60 * 60 * 1000)) / 1000);

        const [
            totalOrders,
            ordersByStatus,
            avgOrderValue,
            topPerformingShops,
            dailyOrderStats
        ] = await Promise.all([
            // Total orders count
            prisma.tikTokOrder.count({
                where: {
                    ...shopFilter,
                    createTime: { gte: startTime }
                }
            }),

            // Orders by status
            prisma.tikTokOrder.groupBy({
                by: ['status'],
                where: {
                    ...shopFilter,
                    createTime: { gte: startTime }
                },
                _count: {
                    status: true
                }
            }),

            // Average order value
            prisma.tikTokOrderPayment.findMany({
                where: {
                    order: {
                        ...shopFilter,
                        createTime: { gte: startTime }
                    }
                },
                select: {
                    totalAmount: true
                }
            }),

            // Top performing shops
            prisma.tikTokOrder.groupBy({
                by: ['shopId'],
                where: {
                    ...shopFilter,
                    createTime: { gte: startTime }
                },
                _count: {
                    shopId: true
                },
                orderBy: {
                    _count: {
                        shopId: 'desc'
                    }
                },
                take: 10
            }),

            // Daily order statistics (simplified approach)
            prisma.tikTokOrder.findMany({
                where: {
                    ...shopFilter,
                    createTime: { gte: startTime }
                },
                select: {
                    createTime: true,
                    payment: {
                        select: {
                            totalAmount: true
                        }
                    }
                },
                orderBy: {
                    createTime: 'desc'
                }
            })
        ]);

        // Process daily stats manually
        const dailyStats = dailyOrderStats.reduce((acc: any, order) => {
            const date = new Date(order.createTime * 1000).toISOString().split('T')[0];
            if (!acc[date]) {
                acc[date] = { orderCount: 0, totalValue: 0 };
            }
            acc[date].orderCount += 1;
            acc[date].totalValue += parseFloat(order.payment?.totalAmount || '0');
            return acc;
        }, {});

        const orderTrends = Object.entries(dailyStats)
            .map(([date, stats]: [string, any]) => ({
                date,
                orderCount: stats.orderCount,
                avgValue: stats.orderCount > 0 ? stats.totalValue / stats.orderCount : 0
            }))
            .sort((a, b) => b.date.localeCompare(a.date))
            .slice(0, 30);

        // Get shop names for top performing shops
        const shopIds = topPerformingShops.map(shop => shop.shopId);
        const shops = shopIds.length > 0 ? await prisma.shopAuthorization.findMany({
            where: { shopId: { in: shopIds } },
            select: { shopId: true, shopName: true }
        }) : [];

        const shopNameMap = new Map(shops.map(s => [s.shopId, s.shopName]));

        return NextResponse.json({
            overview: {
                totalOrders,
                avgOrderValue: avgOrderValue.length > 0 
                    ? avgOrderValue.reduce((sum, payment) => sum + parseFloat(payment.totalAmount || '0'), 0) / avgOrderValue.length
                    : 0,
                completedOrders: ordersByStatus.find(s => s.status === 'COMPLETED')?._count.status || 0,
                pendingOrders: ordersByStatus.filter(s => ['PROCESSING', 'SHIPPED'].includes(s.status))
                    .reduce((sum, s) => sum + s._count.status, 0)
            },
            ordersByStatus: ordersByStatus.map(item => ({
                status: item.status,
                count: item._count.status
            })),
            trends: orderTrends,
            topShops: topPerformingShops.map(shop => ({
                shopId: shop.shopId,
                shopName: shopNameMap.get(shop.shopId) || shop.shopId,
                orderCount: shop._count.shopId
            }))
        });

    } catch (error) {
        console.error('Error fetching orders performance:', error);
        return NextResponse.json(
            { error: 'Failed to fetch orders performance data' },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}
