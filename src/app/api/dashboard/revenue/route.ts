import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getUserWithShopAccess } from "@/lib/auth";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const days = parseInt(searchParams.get('days') || '30');
        
        const { user, accessibleShopIds, isAdmin } = await getUserWithShopAccess(req, prisma);

        const shopFilter = isAdmin ? {} : { shopId: { in: accessibleShopIds } };
        const startTime = Math.floor((Date.now() - (days * 24 * 60 * 60 * 1000)) / 1000);

        const [
            totalPayments,
            totalWithdrawals,
            revenueByShop,
            paymentsByStatus
        ] = await Promise.all([
            // Total payments - fetch all and calculate manually
            prisma.payment.findMany({
                where: {
                    ...shopFilter,
                    channel: 'TIKTOK', // Filter for TikTok payments
                    createTime: { gte: startTime },
                    settlementAmountValue: { not: null }
                },
                select: {
                    settlementAmountValue: true,
                    paymentId: true
                }
            }),

            // Total withdrawals - fetch all and calculate manually
            prisma.withdrawal.findMany({
                where: {
                    ...shopFilter,
                    channel: 'TIKTOK', // Filter for TikTok withdrawals
                    createTime: { gte: startTime }
                },
                select: {
                    amount: true,
                    withdrawalId: true
                }
            }),

            // Revenue by shop - fetch all and group manually
            prisma.payment.findMany({
                where: {
                    ...shopFilter,
                    channel: 'TIKTOK',
                    createTime: { gte: startTime },
                    settlementAmountValue: { not: null }
                },
                select: {
                    shopId: true,
                    settlementAmountValue: true
                }
            }),

            // Payments by status - fetch all and group manually
            prisma.payment.findMany({
                where: {
                    ...shopFilter,
                    channel: 'TIKTOK',
                    createTime: { gte: startTime }
                },
                select: {
                    status: true,
                    settlementAmountValue: true
                }
            })
        ]);

        // Calculate totals manually
        const totalRevenue = totalPayments.reduce((sum, p) => sum + parseFloat(p.settlementAmountValue || '0'), 0);
        const totalWithdrawalAmount = totalWithdrawals.reduce((sum, w) => sum + (w.amount || 0), 0);

        // Group revenue by shop manually
        const shopRevenueMap = revenueByShop.reduce((acc: any, payment) => {
            if (!acc[payment.shopId]) {
                acc[payment.shopId] = { revenue: 0, count: 0 };
            }
            acc[payment.shopId].revenue += parseFloat(payment.settlementAmountValue || '0');
            acc[payment.shopId].count += 1;
            return acc;
        }, {});

        const revenueByShopArray = Object.entries(shopRevenueMap)
            .map(([shopId, data]: [string, any]) => ({
                shopId,
                revenue: data.revenue,
                paymentCount: data.count
            }))
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 10);

        // Group payments by status manually
        const statusMap = paymentsByStatus.reduce((acc: any, payment) => {
            if (!acc[payment.status]) {
                acc[payment.status] = { count: 0, amount: 0 };
            }
            acc[payment.status].count += 1;
            acc[payment.status].amount += parseFloat(payment.settlementAmountValue || '0');
            return acc;
        }, {});

        const paymentsByStatusArray = Object.entries(statusMap)
            .map(([status, data]: [string, any]) => ({
                status,
                count: data.count,
                amount: data.amount
            }));

        // Get shop names for revenue by shop
        const shopIds = revenueByShopArray.map(shop => shop.shopId);
        const shops = shopIds.length > 0 ? await prisma.shopAuthorization.findMany({
            where: { id: { in: shopIds } }, // Use ObjectId instead of shopId
            select: { id: true, shopId: true, shopName: true }
        }) : [];

        const shopNameMap = new Map(shops.map(s => [s.id, s.shopName]));

        return NextResponse.json({
            overview: {
                totalRevenue: Number(totalRevenue.toFixed(2)),
                totalPayments: totalPayments.length,
                totalWithdrawals: Number(totalWithdrawalAmount.toFixed(2)),
                pendingPayments: paymentsByStatusArray.filter(p => p.status !== 'COMPLETED')
                    .reduce((sum, p) => sum + p.count, 0)
            },
            revenueByShop: revenueByShopArray.map(shop => ({
                shopId: shop.shopId,
                shopName: shopNameMap.get(shop.shopId) || shop.shopId,
                revenue: Number(shop.revenue.toFixed(2)),
                paymentCount: shop.paymentCount
            })),
            paymentsByStatus: paymentsByStatusArray.map(item => ({
                status: item.status,
                count: item.count,
                amount: Number(item.amount.toFixed(2))
            }))
        });

    } catch (error) {
        console.error('Error fetching revenue data:', error);
        return NextResponse.json(
            { error: 'Failed to fetch revenue data' },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}
