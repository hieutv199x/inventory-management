import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, Channel } from "@prisma/client";
import { getUserWithShopAccess, getActiveShopIds } from "@/lib/auth";
import { TikTokShopNodeApiClient } from "@/nodejs_sdk";
import {
    isNegativeTrackingDescription,
    markOrderAsProblemInTransit,
    prepareTrackingEventRecords,
    trackingEventsIndicateProblem
} from "@/lib/tiktok-tracking-utils";

const prisma = new PrismaClient();

function resolveShopCipher(shopCipher?: string | null, channelData?: string | null): string | undefined {
    if (shopCipher) return shopCipher;
    if (!channelData) return undefined;

    try {
        const parsed = JSON.parse(channelData);
        if (parsed && typeof parsed === "object" && parsed.shopCipher) {
            return String(parsed.shopCipher);
        }
    } catch (error) {
        console.warn("Failed to parse channelData for shopCipher", error);
    }

    return undefined;
}

function mapTrackingRecords(records: Array<{ id: string; description: string; updateTimeMilli: number; createdAt: Date }>) {
    return records.map(record => ({
        id: record.id,
        description: record.description,
        updateTimeMilli: record.updateTimeMilli,
        createdAt: record.createdAt
    }));
}

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ orderId: string }> }
) {
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

        const { orderId } = await params;

        if (!orderId) {
            return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
        }

        const order = await prisma.order.findUnique({
            where: { orderId },
            select: {
                id: true,
                orderId: true,
                shopId: true,
                shop: {
                    select: {
                        id: true,
                        shopId: true,
                        shopCipher: true,
                        channelData: true,
                        accessToken: true,
                        app: {
                            select: {
                                channel: true,
                                appKey: true,
                                appSecret: true,
                                BaseUrl: true
                            }
                        }
                    }
                }
            }
        });

        if (!order) {
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }

        const tiktokShopId = order.shop?.shopId;
        if (!isAdmin) {
            if (!tiktokShopId || !accessibleShopIds.includes(tiktokShopId)) {
                return NextResponse.json({ error: "Access denied" }, { status: 403 });
            }
            if (!activeShopIds.includes(tiktokShopId)) {
                return NextResponse.json({ error: "Order not found or shop inactive" }, { status: 404 });
            }
        }

    if (!order.shop || order.shop.app?.channel !== Channel.TIKTOK) {
            return NextResponse.json({ error: "Tracking sync only supported for TikTok orders" }, { status: 400 });
        }

        let trackingRecords = await prisma.orderTrackingInfo.findMany({
            where: { orderId: order.id },
            orderBy: [{ updateTimeMilli: "desc" }]
        });
        let dataSource: "database" | "tiktok" = "database";

        if (trackingRecords.some(record => isNegativeTrackingDescription(record.description))) {
            await markOrderAsProblemInTransit(prisma, order.id);
        }

        if (trackingRecords.length === 0) {
            const shopCipher = resolveShopCipher(order.shop.shopCipher, order.shop.channelData);
            const accessToken = order.shop.accessToken;
            const app = order.shop.app;

            if (!accessToken || !app?.appKey || !app?.appSecret) {
                return NextResponse.json({ error: "Shop credentials missing" }, { status: 500 });
            }

            const basePath = app.BaseUrl ?? process.env.TIKTOK_BASE_URL;
            const client = new TikTokShopNodeApiClient({
                config: {
                    basePath,
                    app_key: app.appKey,
                    app_secret: app.appSecret
                }
            });

            try {
                const trackingInfo = await client.api.FulfillmentV202309Api.OrdersOrderIdTrackingGet(
                    order.orderId,
                    accessToken,
                    "application/json",
                    shopCipher
                );

                const trackingEvents = trackingInfo?.body?.data?.tracking;
                if (Array.isArray(trackingEvents) && trackingEvents.length > 0) {
                    if (trackingEventsIndicateProblem(trackingEvents)) {
                        await markOrderAsProblemInTransit(prisma, order.id);
                    }

                    const preparedEvents = prepareTrackingEventRecords(order.id, trackingEvents);

                    if (preparedEvents.length > 0) {
                        await prisma.orderTrackingInfo.deleteMany({ where: { orderId: order.id } });
                        await prisma.orderTrackingInfo.createMany({ data: preparedEvents });

                        trackingRecords = await prisma.orderTrackingInfo.findMany({
                            where: { orderId: order.id },
                            orderBy: [{ updateTimeMilli: "desc" }]
                        });
                        dataSource = "tiktok";

                        if (trackingRecords.some(record => isNegativeTrackingDescription(record.description))) {
                            await markOrderAsProblemInTransit(prisma, order.id);
                        }
                    }
                }
            } catch (error: any) {
                const status = error?.statusCode || error?.response?.statusCode;
                console.error(`Failed to fetch tracking for order ${order.orderId}`, error);

                if (status === 401) {
                    return NextResponse.json({ error: "TikTok authorization failed" }, { status: 401 });
                }

                return NextResponse.json({ error: error?.message || "Failed to fetch tracking information" }, { status: 502 });
            }
        }

        return NextResponse.json({
            trackingInfos: mapTrackingRecords(trackingRecords),
            dataSource
        });
    } catch (err: any) {
        console.error("Error retrieving tracking history:", err);
        if (err?.message === "Authentication required" || err?.message === "User not found") {
            return NextResponse.json({ error: err.message }, { status: 401 });
        }
        return NextResponse.json({ error: err?.message || "Internal error" }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}
