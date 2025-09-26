import { getUserWithShopAccess } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import { NextRequest } from "next/server";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
    try {
        const url = new URL(req.url);
        const shopId = url.searchParams.get('shopId') || '';
        const { accessibleShopIds } = await getUserWithShopAccess(req, prisma);
        
        // Calculate the Unix timestamp for the current moment
        const now = Math.floor(Date.now() / 1000);
        // Calculate the Unix timestamp for 24 hours from now
        const twentyFourHoursFromNow = now + (24 * 60 * 60);
        // Calculate the Unix timestamp for 48 hours ago
        const deadline = now - (48 * 60 * 60);
        const countShipingWithin24 = await prisma.order.count({
            where: {
                status: "AWAITING_SHIPMENT",
                shopId: { in: accessibleShopIds },
                createTime: {
                    lt: deadline,
                },
            }
        });

        const countAutoCancelled = await prisma.order.count({
            where: {
                shopId: { in: accessibleShopIds },
                OR: [
                    {
                        shippingDueTime: {
                            gt: now,
                            lt: twentyFourHoursFromNow,
                        },
                        status: { notIn: ["AWAITING_COLLECTION", "IN_TRANSIT", "DELIVERED", "COMPLETED", "CANCELLED"] }
                    },
                    {
                        collectionDueTime: {
                            gt: now,
                            lt: twentyFourHoursFromNow,
                        },
                        status: { notIn: ["IN_TRANSIT", "DELIVERED", "COMPLETED", "CANCELLED"] }
                    },
                    {
                        deliveryDueTime: {
                            gt: now,
                            lt: twentyFourHoursFromNow,
                        },
                        status: { notIn: ["DELIVERED", "COMPLETED", "CANCELLED"] }
                    }
                ]
            }
        });


        const countShippingOverdue = await prisma.order.count({
            where: {
                status: "AWAITING_SHIPMENT",
                shippingDueTime: {
                    gte: now,
                },
                shopId: { in: accessibleShopIds },
            }
        });

        const countBuyerCancelled = await prisma.order.count({
            where: {
                status: { not: "CANCELLED" },
                shopId: { in: accessibleShopIds },
                channelData: {
                    contains: '"isBuyerRequestCancel":"true"',
                },
            }
        });

        return new Response(JSON.stringify({
            countShipingWithin24: await countShipingWithin24,
            countAutoCancelled: await countAutoCancelled,
            countShippingOverdue: await countShippingOverdue,
            countBuyerCancelled: await countBuyerCancelled,
        }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    } catch (error) {
        console.error('Error parsing request parameters:', error);
        return new Response('Invalid request', { status: 400 });
    }

}