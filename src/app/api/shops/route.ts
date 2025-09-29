import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getUserWithShopAccess } from "@/lib/auth";
import { resolveOrgContext, requireOrg, withOrgScope } from '@/lib/tenant-context';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
    try {
    const { user, accessibleShopIds, isAdmin } = await getUserWithShopAccess(req, prisma);
    const orgResult = await resolveOrgContext(req, prisma);
    const org = requireOrg(orgResult);
        
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '12');
        const status = searchParams.get('status') || 'ACTIVE';
        const search = searchParams.get('search')?.trim() || '';
        const userId = searchParams.get('userId');

        const skip = (page - 1) * limit;

        // Build where clause based on user permissions and search
        let whereClause: any = {};

        // Status filter
        if (status && status !== 'ALL') {
            whereClause.status = status;
        }

        // Search functionality - search across multiple fields
        if (search) {
            whereClause.OR = [
                // Search by shop name (case insensitive)
                {
                    shopName: {
                        contains: search,
                        mode: 'insensitive'
                    }
                },
                // Search by managed name (case insensitive)
                {
                    managedName: {
                        contains: search,
                        mode: 'insensitive'
                    }
                },
                // Search by shop ID (TikTok shop ID)
                {
                    shopId: {
                        contains: search,
                        mode: 'insensitive'
                    }
                },
                // Search by region/country
                {
                    region: {
                        contains: search,
                        mode: 'insensitive'
                    }
                },
                // Search by app name
                {
                    app: {
                        appName: {
                            contains: search,
                            mode: 'insensitive'
                        }
                    }
                }
            ];
        }

        // Role-based access control
        if (!isAdmin) {
            // For non-admin users, filter by accessible shops
            if (accessibleShopIds.length === 0) {
                // User has no shop access
                return NextResponse.json({
                    shops: [],
                    pagination: {
                        page,
                        limit,
                        total: 0,
                        totalPages: 0
                    }
                });
            }

            // Filter by accessible shop IDs (TikTok shop IDs)
            whereClause.id = {
                in: accessibleShopIds
            };
        }

        // Always enforce org scope
        const scopedWhere = withOrgScope(org.id, whereClause);
        const total = await prisma.shopAuthorization.count({
            where: scopedWhere
        });

        const totalPages = Math.ceil(total / limit);

        // Fetch shops with all necessary data
        const shops = await prisma.shopAuthorization.findMany({
            where: scopedWhere,
            include: {
                app: {
                    select: {
                        id: true,
                        appName: true,
                        appKey: true,
                        appSecret: true,
                        channel: true,
                        isActive: true
                    }
                }
            },
            orderBy: [
                { updatedAt: 'desc' },
                { createdAt: 'desc' }
            ],
            skip,
            take: limit
        });

        // Transform the data to match frontend expectations
        const transformedShops = shops.map(shop => ({
            id: shop.id,
            shopId: shop.shopId, // TikTok shop ID
            shopName: shop.shopName,
            managedName: shop.managedName,
            shopCipher: shop.shopCipher,
            region: shop.region,
            status: shop.status,
            createdAt: shop.createdAt.toISOString(),
            updatedAt: shop.updatedAt.toISOString(),
            app: {
                id: shop?.app?.id,
                appName: shop?.app?.appName,
                channel: shop?.app?.channel,
                appSecret: shop?.app?.appSecret
            }
        }));

        return NextResponse.json({
            shops: transformedShops,
            pagination: {
                page,
                limit,
                total,
                totalPages
            }
        });

    } catch (err: any) {
        console.error("Error fetching shops:", err);
        
        if (err.message === 'Authentication required' || err.message === 'User not found') {
            return NextResponse.json({ error: err.message }, { status: 401 });
        }
        
        return NextResponse.json(
            { error: err.message || "Failed to fetch shops" },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}
