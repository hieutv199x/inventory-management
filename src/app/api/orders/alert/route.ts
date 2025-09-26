import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: Request) {
    try {
        const url = new URL(req.url);
        const shopId = url.searchParams.get('shopId') || '';

        // Calculate the Unix timestamp for the current moment
        const now = Math.floor(Date.now() / 1000);
        // Calculate the Unix timestamp for 24 hours from now
        const twentyFourHoursFromNow = now + (24 * 60 * 60);
        // Calculate the Unix timestamp for 48 hours ago
        const deadline = now - (48 * 60 * 60);
        const countShipingWithin24 = await prisma.order.count({
            where: {
                status: "AWAITING_SHIPMENT",
                ...(shopId ? { shopId } : {}),
                createTime: {
                    lt: deadline,
                },
            }
        });

        const countAutoCancelled = await prisma.order.count({
            where: {
                ...(shopId ? { shopId } : {}),
                OR: [
                    {
                        shippingDueTime: {
                            gt: now,
                            lt: twentyFourHoursFromNow,
                        },
                        status: { notIn: ["AWAITING_COLLECTION", "IN_TRANSIT", "DELIVERED", "COMPLETED"] }
                    },
                    {
                        collectionDueTime: {
                            gt: now,
                            lt: twentyFourHoursFromNow,
                        },
                        status: { notIn: ["IN_TRANSIT", "DELIVERED", "COMPLETED"] }
                    },
                    {
                        deliveryDueTime: {
                            gt: now,
                            lt: twentyFourHoursFromNow,
                        },
                        status: { notIn: ["DELIVERED", "COMPLETED"] }
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
                ...(shopId ? { shopId } : {}),
            }
        });

        const countBuyerCancelled = await prisma.order.count({
            where: {
                status: { not: "CANCELLED" },
                ...(shopId ? { shopId } : {}),
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