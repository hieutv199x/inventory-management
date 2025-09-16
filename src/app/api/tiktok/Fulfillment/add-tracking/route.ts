import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, Channel } from "@prisma/client";
import { TikTokShopNodeApiClient } from '@/nodejs_sdk/client/client';
import { Fulfillment202309UpdatePackageShippingInfoRequestBody, Fulfillment202309UpdateShippingInfoRequestBody } from '@/nodejs_sdk';
import { TikTokOrderSync } from '@/lib/tiktok-order-sync';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
    try {
        const { orderId, trackingNumber, shippingProviderId, packageId } = await req.json();

        if (!orderId) {
            return NextResponse.json({ error: 'Missing orderId parameter' }, { status: 400 });
        }

        // Fetch order to get shopId
        const order = await prisma.order.findUnique({
            where: { orderId: orderId },
            include: { shop: { include: { app: true } } },
        });

        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        if (!order.shopId) {
            return NextResponse.json({ error: 'Shop authorization not found' }, { status: 404 });
        }
        const shop = order.shop;
        try {
            // Extract shopCipher from channelData
            let shopCipher = shop.shopCipher; // Legacy field
            if (shop.channelData) {
                try {
                    const channelData = JSON.parse(shop.channelData);
                    shopCipher = channelData.shopCipher || shopCipher;
                } catch (error) {
                    console.warn(`Failed to parse channelData for shop ${shop.shopId}, using legacy shopCipher`);
                }
            }

            if (!shop.app) {
                console.error(`Missing app information for shop ${shop.shopId}`);
                return NextResponse.json({ error: `Missing app information for shop ${shop.shopId}` }, { status: 404 });
            }

            const credentials = {
                accessToken: shop.accessToken,
                shopCipher: shopCipher,
                app: {
                    appKey: shop.app.appKey,
                    appSecret: shop.app.appSecret,
                    BaseUrl: shop.app.BaseUrl,
                },
            };

            if (!credentials.accessToken || !credentials.shopCipher) {
                console.error(`Missing credentials for shop ${shop.shopId}`);
                return NextResponse.json({ error: `Missing credentials for shop ${shop.shopId}` }, { status: 404 });
            }
            let basePath = process.env.TIKTOK_BASE_URL;
            if (credentials.app?.BaseUrl) {
                basePath = credentials.app.BaseUrl;
            }
            const client = new TikTokShopNodeApiClient({
                config: {
                    basePath: basePath,
                    app_key: credentials.app.appKey,
                    app_secret: credentials.app.appSecret,
                },
            });

            if (packageId) {
                const fulfillment202309UpdatePackageShippingInfoRequestBody = new Fulfillment202309UpdatePackageShippingInfoRequestBody();
                fulfillment202309UpdatePackageShippingInfoRequestBody.trackingNumber = trackingNumber;
                fulfillment202309UpdatePackageShippingInfoRequestBody.shippingProviderId = shippingProviderId;
                const result = await client.api.FulfillmentV202309Api.PackagesPackageIdShippingInfoUpdatePost(packageId, shop.accessToken, "application/json", credentials.shopCipher, fulfillment202309UpdatePackageShippingInfoRequestBody);
                console.log('response: ', JSON.stringify(result, null, 2));
                if (result.body.code === 0) {
                    const tikTokOrderSync = await TikTokOrderSync.create(shop.shopId);
                    await tikTokOrderSync.syncOrders({
                        shop_id: shop.shopId,
                        order_ids: [orderId]
                    });
                }
                return NextResponse.json(result.body.message);
            } else {
                const fulfillment202309UpdateShippingInfoRequestBody = new Fulfillment202309UpdateShippingInfoRequestBody();
                fulfillment202309UpdateShippingInfoRequestBody.trackingNumber = trackingNumber;
                fulfillment202309UpdateShippingInfoRequestBody.shippingProviderId = shippingProviderId;
                const result = await client.api.FulfillmentV202309Api.OrdersOrderIdShippingInfoUpdatePost(orderId, shop.accessToken, 'application/json', credentials.shopCipher, fulfillment202309UpdateShippingInfoRequestBody);
                console.log('response: ', JSON.stringify(result, null, 2));
                if (result.body.code === 0) {
                    const tikTokOrderSync = await TikTokOrderSync.create(shop.shopId);
                    await tikTokOrderSync.syncOrders({
                        shop_id: shop.shopId,
                        order_ids: [orderId]
                    });
                }
                return NextResponse.json(result.body.message);
            }


        } catch (error) {
            console.error(`Error processing shop ${shop.shopId}:`, error);
            return NextResponse.json({ error: `Error processing shop ${shop.shopId}` }, { status: 500 });
        }

        return NextResponse.json("ok");
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}