import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getUserWithShopAccess, validateShopAccess, getActiveShopIds } from "@/lib/auth";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
    try {
        const { user, accessibleShopIds, isAdmin } = await getUserWithShopAccess(req, prisma);
        const activeShopIds = await getActiveShopIds(prisma);

        const {
            shopId,
            createTimeGe,
            createTimeLt,
            status,
            page = 1,
            pageSize = 20,
        } = await req.json();

        const where: any = {};

        // Validate shop access
        const { shopFilter, hasAccess } = validateShopAccess(shopId, isAdmin, accessibleShopIds, activeShopIds);
        
        if (!hasAccess) {
            return NextResponse.json({
                orders: [],
                pagination: { total: 0, page: 1, pageSize: 20, totalPages: 0 }
            });
        }

        where.shopId = shopFilter;

        // Get orders based on the constructed where clause
        const skip = (page - 1) * pageSize;

        const [orders, total] = await Promise.all([
            prisma.tikTokOrder.findMany({
                where,
                include: {
                    lineItems: true,
                    payment: true,
                    recipientAddress: {
                        include: {
                            districtInfo: true,
                        }
                    },
                    packages: true,
                    shop: {
                        select: {
                            shopName: true,
                            shopId: true,
                        }
                    }
                },
                orderBy: {
                    createTime: 'desc',
                },
                skip,
                take: pageSize,
            }),
            prisma.tikTokOrder.count({ where }),
        ]);

        return NextResponse.json({
            orders,
            pagination: {
                total,
                page,
                pageSize,
                totalPages: Math.ceil(total / pageSize),
            }
        });

    } catch (err: any) {
        console.error("Error fetching stored orders:", err);
        if (err.message === 'Authentication required' || err.message === 'User not found') {
            return NextResponse.json({ error: err.message }, { status: 401 });
        }
        return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}