import { NextRequest, NextResponse } from "next/server";
import { Prisma, PrismaClient } from "@prisma/client";
import { getUserWithShopAccess, getActiveShopIds, validateShopAccess } from "@/lib/auth";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
    try {
        const {
            accessibleShopIds,
            isAdmin,
            managedGroupIds = [],
            directShopIds = [],
            activeOrgId
        } = await getUserWithShopAccess(req, prisma);
        const activeShopIds = await getActiveShopIds(prisma, {
            orgId: activeOrgId ?? undefined,
            groupIds: isAdmin ? undefined : managedGroupIds,
            shopIds: isAdmin ? undefined : directShopIds
        });

        const { searchParams } = req.nextUrl;

        const shopId = searchParams.get("shopId");
        const status = searchParams.get("status");
        const listingQuality = searchParams.get("listingQuality");
        const keyword = searchParams.get("keyword");
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");

        const filters: Prisma.ProductWhereInput = {};

        // Validate shop access
        const { shopFilter, hasAccess } = validateShopAccess(shopId, isAdmin, accessibleShopIds, activeShopIds);
        
        if (!hasAccess) {
            return NextResponse.json([]);
        }

        filters.shopId = shopFilter;

        // Get active shops only
        const activeShopRecords = activeShopIds.length > 0
            ? await prisma.shopAuthorization.findMany({
                where: { id: { in: activeShopIds } },
                select: { id: true, shopId: true },
            })
            : [];

        const activeShopIdsFromDb = activeShopRecords
            .map(shop => shop.shopId)
            .filter((id): id is string => Boolean(id));

        // Filter to only include active shops
        if (filters.shopId) {
            if (
                typeof filters.shopId === 'object' &&
                filters.shopId.in &&
                Array.isArray(filters.shopId.in)
            ) {
                filters.shopId.in = filters.shopId.in.filter((id: string) => activeShopIdsFromDb.includes(id));
            } else if (
                typeof filters.shopId === 'string' &&
                !activeShopIdsFromDb.includes(filters.shopId)
            ) {
                // If shopId is not active, return empty result
                return NextResponse.json([]);
            }
        } else {
            filters.shopId = { in: activeShopIdsFromDb };
        }

        if (status && status.toLowerCase() !== 'all') {
            filters.status = status.toUpperCase();
        }
        if (listingQuality && listingQuality !== 'UNKNOWN') {
        }
        if (keyword) {
            filters.OR = [
                {
                    title: {
                        contains: keyword,
                        mode: "insensitive"
                    }
                },
                {
                    productId: {
                        contains: keyword,
                        mode: "insensitive"
                    }
                }
            ];
        }

        // Date filtering by product createTime (Unix seconds)
        if (startDate && endDate) {
            const parseDate = (val: string): Date | null => {
                const d = new Date(val);
                if (!isNaN(d.getTime())) return d;
                // Try dd/MM/yyyy
                const m = val.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
                if (m) {
                    const [, dd, mm, yyyy] = m;
                    const parsed = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
                    return isNaN(parsed.getTime()) ? null : parsed;
                }
                return null;
            };

            const sDate = parseDate(startDate);
            const eDate = parseDate(endDate);
            if (sDate && eDate) {
                eDate.setHours(23, 59, 59, 999);
                const sTs = Math.floor(sDate.getTime() / 1000);
                const eTs = Math.floor(eDate.getTime() / 1000);
                (filters as Prisma.ProductWhereInput).createTime = { gte: sTs, lte: eTs };
            }
        }

        const products = await prisma.product.findMany({
            where: filters,
            include: {
                brand: true,
                audit: true,
                images: true,
                skus: {
                    include: {
                        price: true,
                        inventory: true
                    }
                },
                attributes: {
                    include: {
                        values: true
                    }
                },
                dimensions: true,
                weight: true,
                categories: true,
            },
            orderBy: {
                createTime: 'desc'
            }
        });
        const uniqueShopIds = [...new Set(products.map((p) => p.shopId))].filter((id): id is string => typeof id === 'string');
        const shopAuths = await prisma.shopAuthorization.findMany({
            where: { shopId: { in: uniqueShopIds } },
            select: {
                shopId: true,
                shopName: true,
            },
        });

        const shopMap = Object.fromEntries(shopAuths.map((s) => [s.shopId, s.shopName]));

        const resultWithShopName = products.map((p) => ({
            ...p,
            shopName: p.shopId ? shopMap[p.shopId] || null : null,
        }));
        console.log(resultWithShopName);
        return NextResponse.json(resultWithShopName);

    } catch (error: unknown) {
        console.error("Error in product GET API:", error);
        if (error instanceof Error && (error.message === 'Authentication required' || error.message === 'User not found')) {
            return NextResponse.json({ error: error.message }, { status: 401 });
        }
        const message = error instanceof Error ? error.message : "An unknown server error occurred.";
        return NextResponse.json({ error: message }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}