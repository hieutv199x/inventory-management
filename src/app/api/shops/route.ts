import { NextRequest, NextResponse } from "next/server";
import { Prisma, PrismaClient } from "@prisma/client";
import { getUserWithShopAccess } from "@/lib/auth";
import { resolveOrgContext, requireOrg, withOrgScope } from '@/lib/tenant-context';

const prisma = new PrismaClient();

const shopInclude = {
    app: {
        select: {
            id: true,
            appName: true,
            appKey: true,
            appSecret: true,
            channel: true,
            isActive: true
        }
    },
    group: {
        select: {
            id: true,
            name: true,
            manager: {
                select: {
                    id: true,
                    name: true
                }
            }
        }
    },
    userShopRoles: {
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    username: true,
                    role: true
                }
            }
        }
    }
} satisfies Prisma.ShopAuthorizationInclude;

type ShopWithRelations = Prisma.ShopAuthorizationGetPayload<{
    include: typeof shopInclude;
}>;

export async function GET(req: NextRequest) {
    try {
    const {
        accessibleShopIds,
        directShopIds = [],
        managedGroupShopIds = [],
        isAdmin,
        isManager
    } = await getUserWithShopAccess(req, prisma);
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
            // Determine allowed shops based on role-specific scopes
            const managerScopedShops = Array.from(new Set([
                ...managedGroupShopIds,
                ...directShopIds
            ]));

            const allowedShopIds = isManager
                ? (managerScopedShops.length > 0 ? managerScopedShops : accessibleShopIds)
                : (directShopIds.length > 0 ? directShopIds : accessibleShopIds);

            if (!allowedShopIds || allowedShopIds.length === 0) {
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
                in: allowedShopIds
            };
        }

        // Always enforce org scope
        const scopedWhere = withOrgScope(org.id, whereClause);
        const total = await prisma.shopAuthorization.count({
            where: scopedWhere
        });

        const shops: ShopWithRelations[] = await prisma.shopAuthorization.findMany({
            where: scopedWhere,
            include: shopInclude,
            orderBy: [
                { updatedAt: 'desc' },
                { createdAt: 'desc' }
            ],
            skip,
            take: limit
        });

        const totalPages = limit > 0 ? Math.ceil(total / limit) : 1;

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
            },
            group: shop.group ? {
                id: shop.group.id,
                name: shop.group.name,
                manager: shop.group.manager ? {
                    id: shop.group.manager.id,
                    name: shop.group.manager.name
                } : null
            } : null,
            userAssignments: shop.userShopRoles.map(role => ({
                id: role.id,
                role: role.role,
                user: role.user ? {
                    id: role.user.id,
                    name: role.user.name,
                    username: role.user.username,
                    systemRole: role.user.role
                } : null,
                createdAt: role.createdAt.toISOString()
            }))
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
