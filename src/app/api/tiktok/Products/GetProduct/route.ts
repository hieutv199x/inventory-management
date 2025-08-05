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

        if (startDate || endDate) {
            filters.createdAt = {};
            if (startDate) {
                const sDate = new Date(startDate);
                if (!isNaN(sDate.getTime())) {
                    filters.createdAt.gte = sDate;
                }
            }
            if (endDate) {
                const eDate = new Date(endDate);
                if (!isNaN(eDate.getTime())) {
                    eDate.setHours(23, 59, 59, 999);
                    filters.createdAt.lte = eDate;
                }
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
                createdAt: 'desc'
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