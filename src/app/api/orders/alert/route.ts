import { getUserWithShopAccess } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import { NextRequest } from "next/server";
import { resolveOrgContext, requireOrg } from '@/lib/tenant-context';
import fa from "zod/v4/locales/fa.cjs";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
    try {
        // Resolve active organization for multi-tenant scoping
        const orgResult = await resolveOrgContext(req, prisma);
        const org = requireOrg(orgResult);

        const url = new URL(req.url);
        const shopId = url.searchParams.get('shopId') || '';
        const { accessibleShopIds, user } = await getUserWithShopAccess(req, prisma, true);

        // Calculate the Unix timestamp for the current moment
        const now = Math.floor(Date.now() / 1000);
        // Calculate the Unix timestamp for 24 hours from now
        const twentyFourHoursFromNow = now + (24 * 60 * 60);
        // Calculate the Unix timestamp for 48 hours ago
        const deadline = now - (48 * 60 * 60);
        // If user has no shop access within org, return zero counts quickly
        if (!accessibleShopIds || accessibleShopIds.length === 0) {
            return new Response(JSON.stringify({
                countShipingWithin24: 0,
                countAutoCancelled: 0,
                countShippingOverdue: 0,
                countBuyerCancelled: 0,
            }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }

        const scopedShopIds = accessibleShopIds; // already internal shop IDs
        const baseShopWhere: any = { orgId: org.id };
        if (user.role !== 'ADMIN') {
            baseShopWhere.shopId = { in: scopedShopIds };
        }

        const countShipingWithin24 = await prisma.order.count({
            where: {
                ...baseShopWhere,
                status: "AWAITING_SHIPMENT",
                createTime: { lt: deadline },
            }
        });

        const countAutoCancelled = await prisma.order.count({
            where: {
                ...baseShopWhere,
                OR: [
                    {
                        shippingDueTime: { gt: now, lt: twentyFourHoursFromNow },
                        status: { notIn: ["AWAITING_COLLECTION", "IN_TRANSIT", "DELIVERED", "COMPLETED", "CANCELLED"] }
                    },
                    // {
                    //     collectionDueTime: { gt: now, lt: twentyFourHoursFromNow },
                    //     status: { notIn: ["IN_TRANSIT", "DELIVERED", "COMPLETED", "CANCELLED"] }
                    // },
                    // {
                    //     deliveryDueTime: { gt: now, lt: twentyFourHoursFromNow },
                    //     status: { notIn: ["DELIVERED", "COMPLETED", "CANCELLED"] }
                    // }
                ]
            }
        });


        const countShippingOverdue = await prisma.order.count({
            where: {
                ...baseShopWhere,
                status: "AWAITING_SHIPMENT",
                shippingDueTime: { gte: now },
            }
        });

        const countBuyerCancelled = await prisma.order.count({
            where: {
                ...baseShopWhere,
                status: { not: "CANCELLED" },
                channelData: { contains: '"isBuyerRequestCancel":"true"' },
            }
        });

        return new Response(JSON.stringify({
            countShipingWithin24: countShipingWithin24,
            countAutoCancelled: countAutoCancelled,
            countShippingOverdue: countShippingOverdue,
            countBuyerCancelled: countBuyerCancelled,
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