import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import {
    Fulfillment202309SearchPackageRequestBody,
    Fulfillment202309SearchPackageResponseDataPackages,
    TikTokShopNodeApiClient,
} from "@/nodejs_sdk";
//import { syncOrderById } from "../../webhook/route";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
    try {
        const shop_id = req.nextUrl.searchParams.get("shop_id");

        if (!shop_id ) {
            return NextResponse.json(
                { error: "Missing required fields: shop_id" },
                { status: 400 }
            );
        }

        // Get shop and app info using unified schema
        const credentials = await prisma.shopAuthorization.findUnique({
            where: {
                id: shop_id,
            },
            include: {
                app: true,
            },
        });

        if (!credentials) {
            return NextResponse.json({ error: "Shop not found" }, { status: 404 });
        }

        // Ensure this is a TikTok shop
        if (credentials.app?.channel !== 'TIKTOK') {
            return NextResponse.json({ error: "Not a TikTok shop" }, { status: 400 });
        }

        
        const app_key = credentials.app.appKey;
        const app_secret = credentials.app.appSecret;
        const baseUrl = credentials.app.BaseUrl ?? process.env.TIKTOK_BASE_URL;

        // Extract shopCipher from channelData
        let shopCipher: string | undefined = credentials.shopCipher ?? undefined; // Legacy field
        if (credentials.channelData) {
            try {
                const channelData = JSON.parse(credentials.channelData);
                shopCipher = channelData.shopCipher ?? shopCipher;
            } catch (error) {
                console.warn('Failed to parse channelData, using legacy shopCipher');
            }
        }

        const client = new TikTokShopNodeApiClient({
            config: {
                basePath: baseUrl,
                app_key: app_key,
                app_secret: app_secret,
            },
        });

        const fulfillment202309SearchPackageRequestBody = new Fulfillment202309SearchPackageRequestBody();

        // NEW: allow caller to pass Unix timestamps via query (?createTimeGe=...&createTimeLt=...)
        const nowSec = Math.floor(Date.now() / 1000);
        const geParam = req.nextUrl.searchParams.get("createTimeGe");
        const ltParam = req.nextUrl.searchParams.get("createTimeLt");

        const createTimeGe = geParam ? parseInt(geParam, 10) : (nowSec - 10 * 24 * 3600); // default: last 10 days
        const createTimeLt = ltParam ? parseInt(ltParam, 10) : nowSec;

        if (isNaN(createTimeGe) || isNaN(createTimeLt) || createTimeGe >= createTimeLt) {
            return NextResponse.json(
                { error: "Invalid createTimeGe/createTimeLt (must be valid integers and createTimeGe < createTimeLt)" },
                { status: 400 }
            );
        }

        fulfillment202309SearchPackageRequestBody.createTimeGe = createTimeGe; // was fixed before
        fulfillment202309SearchPackageRequestBody.createTimeLt = createTimeLt; // was fixed before
        fulfillment202309SearchPackageRequestBody.packageStatus = "PROCESSING";

        const result = await client.api.FulfillmentV202309Api.PackagesSearchPost(
            20,
            credentials.accessToken,
            "application/json",
            "order_pay_time",
            "ASC",
            "",
            shopCipher,
            fulfillment202309SearchPackageRequestBody
        );
        console.log('response: ', JSON.stringify(result, null, 2));

        // ---- Persist packages to DB (OrderPackage) ----
        const packages: Fulfillment202309SearchPackageResponseDataPackages[] = result?.body?.data?.packages || [];
        let inserted = 0;
        let updated = 0;
        let skippedNoOrder = 0;
        let total = packages.length;

        if (total > 0) {
            // Gather all orderIds referenced inside each package.orders[]
            const referencedOrderIds = new Set<string>();
            for (const pkg of packages) {
                const raw = (pkg as any);
                const ordersArr = raw.orders || [];
                for (const o of ordersArr) {
                    const oid = o?.id || o?.orderId;
                    if (oid) referencedOrderIds.add(oid);
                }
            }

            // Fetch existing orders (DB) by orderId
            const existingOrders = await prisma.order.findMany({
                where: { orderId: { in: Array.from(referencedOrderIds) } },
                select: { id: true, orderId: true }
            });
            const orderMap = new Map(existingOrders.map(o => [o.orderId, o.id]));

            for (const pkg of packages) {
                try {
                    const raw = (pkg as Fulfillment202309SearchPackageResponseDataPackages);

                    // Determine one primary orderId to associate (choose first orders[].order_id)
                    const firstOrderObj = (raw.orders && raw.orders[0]) || null;
                    const primaryOrderId = firstOrderObj?.id
                    if (!primaryOrderId) {
                        skippedNoOrder++;
                        continue;
                    }
                    const dbOrderId = orderMap.get(primaryOrderId);
                    if (!dbOrderId) {
                        // Order not in DB yet; skip (optionally trigger order sync elsewhere)
                        skippedNoOrder++;
                        continue;
                    }

                    const packageId: string | undefined = raw.id;
                    if (!packageId) {
                        continue;
                    }

                    // Prepare mapped data
                    const mappedData = {
                        packageId,
                        status: raw.status || null,
                        trackingNumber: raw.trackingNumber || raw.trackingNumber || null,
                        shippingProviderId: raw.shippingProviderId || raw.shippingProviderId || null,
                        shippingProviderName: raw.shippingProviderName || raw.shippingProviderName || null,
                        orderLineItemIds: (raw.orderLineItemIds || raw.orderLineItemIds || []) as string[],
                        ordersData: JSON.stringify(raw.orders || []),
                        createTime: raw.createTime || raw.createTime || null,
                        updateTime: raw.updateTime || raw.updateTime || null,
                        updateTimeRaw: raw.updateTime || raw.updateTime || null,
                        // Extended fields left null (not provided by this endpoint)
                        shippingType: null,
                        collectionTime: null,
                        rtsTime: null,
                        rtsSlaTime: null,
                        ttsSlaTime: null,
                        deliverSlaTime: null,
                        deliveredTime: null,
                        inTransitTime: null,
                        channelData: JSON.stringify(raw),
                        orderId: dbOrderId
                    };

                    // Upsert by (orderId, packageId) – emulate composite with findFirst
                    const existing = await prisma.orderPackage.findFirst({
                        where: { orderId: dbOrderId, packageId }
                    });

                    if (existing) {
                        await prisma.orderPackage.update({
                            where: { id: existing.id },
                            data: mappedData
                        });
                        updated++;
                    } else {
                        await prisma.orderPackage.create({ data: mappedData });
                        inserted++;
                    }
                } catch (e) {
                    console.warn('Package persist error:', e);
                }
            }
        }

        return NextResponse.json({
            api: result?.body,
            syncInfo: {
                totalPackages: total,
                inserted,
                updated,
                skippedNoOrder
            }
        });
    } catch (err: any) {
        console.error("Error getting orders:", err);
        return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 });
    }
}