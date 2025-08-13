import { NextRequest, NextResponse } from "next/server";
import { Prisma, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = req.nextUrl;

        const shopId = searchParams.get("shopId");
        const status = searchParams.get("status");
        const listingQuality = searchParams.get("listingQuality");
        const keyword = searchParams.get("keyword");
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");

        const filters: Prisma.ProductWhereInput = {};

        if (shopId) {
            filters.shopId = shopId;
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
        const uniqueShopIds = [...new Set(products.map((p) => p.shopId))];
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
            shopName: shopMap[p.shopId] || null,
        }));
        console.log(resultWithShopName);
        return NextResponse.json(resultWithShopName);

    } catch (error: unknown) {
        console.error("Error in product GET API:", error);
        const message = error instanceof Error ? error.message : "An unknown server error occurred.";
        return NextResponse.json({ error: message }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}