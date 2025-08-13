import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
    try {
        const {
            shopId,
            createTimeGe,
            createTimeLt,
            status,
            page = 1,
            pageSize = 20,
        } = await req.json();

        const where: any = {};
        
        if (shopId) {
            where.shopId = shopId;
        }
        
        if (createTimeGe || createTimeLt) {
            where.createTime = {};
            if (createTimeGe) where.createTime.gte = createTimeGe;
            if (createTimeLt) where.createTime.lt = createTimeLt;
        }
        
        if (status) {
            where.status = status;
        }

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
        return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 });
    }
}
