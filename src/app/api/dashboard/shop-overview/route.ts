import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getUserWithShopAccess } from "@/lib/auth";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
    try {
        const { user, accessibleShopIds, isAdmin, activeOrgId } = await getUserWithShopAccess(req, prisma);

        const orgScope = activeOrgId ? { orgId: activeOrgId } : {};

        // Build shop filter based on user permissions
        const shopFilter = isAdmin
            ? orgScope
            : {
                  ...orgScope,
                  id: { in: accessibleShopIds }
              };

        if (!isAdmin && accessibleShopIds.length === 0) {
            return NextResponse.json({
                overview: {
                    totalShops: 0,
                    activeShops: 0,
                    inactiveShops: 0,
                    expiringTokens: 0
                },
                distribution: {
                    byStatus: [],
                    byRegion: []
                },
                recentActivity: []
            });
        }

        // Get shop overview stats
        const [
            totalShops,
            activeShops,
            shopsByStatus,
            shopsByRegion,
            expiringTokens
        ] = await Promise.all([
            // Total shops count
            prisma.shopAuthorization.count({
                where: shopFilter
            }),

            // Active shops count
            prisma.shopAuthorization.count({
                where: {
                    ...shopFilter,
                    status: 'ACTIVE'
                }
            }),

            // Shops by status
            prisma.shopAuthorization.groupBy({
                by: ['status'],
                where: shopFilter,
                _count: {
                    status: true
                }
            }),

            // Shops by region
            prisma.shopAuthorization.groupBy({
                by: ['region'],
                where: {
                    ...shopFilter,
                    region: { not: null }
                },
                _count: {
                    region: true
                }
            }),

            // Tokens expiring within 7 days
            prisma.shopAuthorization.count({
                where: {
                    ...shopFilter,
                    expiresIn: {
                        lte: 7 * 24 * 60 * 60 // 7 days in seconds
                    }
                }
            })
        ]);

        // Get recent shop activities
        const recentShops = await prisma.shopAuthorization.findMany({
            where: shopFilter,
            select: {
                shopId: true,
                shopName: true,
                status: true,
                region: true,
                createdAt: true,
                updatedAt: true
            },
            orderBy: { updatedAt: 'desc' },
            take: 10
        });

        return NextResponse.json({
            overview: {
                totalShops,
                activeShops,
                inactiveShops: totalShops - activeShops,
                expiringTokens
            },
            distribution: {
                byStatus: shopsByStatus.map(item => ({
                    status: item.status,
                    count: item._count.status
                })),
                byRegion: shopsByRegion.map(item => ({
                    region: item.region,
                    count: item._count.region
                }))
            },
            recentActivity: recentShops
        });

    } catch (error) {
        console.error('Error fetching shop overview:', error);
        return NextResponse.json(
            { error: 'Failed to fetch shop overview data' },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}
