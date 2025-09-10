import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, Channel } from "@prisma/client";
import { TikTokShopNodeApiClient } from '@/nodejs_sdk/client/client';
import { Fulfillment202309UpdateShippingInfoRequestBody } from '@/nodejs_sdk';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
    try {
        const { orderId, trackingNumber, shippingProviderId } = await req.json();

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
                },
            };

            if (!credentials.accessToken || !credentials.shopCipher) {
                console.error(`Missing credentials for shop ${shop.shopId}`);
                return NextResponse.json({ error: `Missing credentials for shop ${shop.shopId}` }, { status: 404 });
            }

            const client = new TikTokShopNodeApiClient({
                config: {
                    basePath: process.env.TIKTOK_BASE_URL,
                    app_key: credentials.app.appKey,
                    app_secret: credentials.app.appSecret,
                },
            });

            const fulfillment202309UpdateShippingInfoRequestBody = new Fulfillment202309UpdateShippingInfoRequestBody();
            fulfillment202309UpdateShippingInfoRequestBody.trackingNumber = trackingNumber;
            fulfillment202309UpdateShippingInfoRequestBody.shippingProviderId = shippingProviderId;
            const result = await client.api.FulfillmentV202309Api.OrdersOrderIdShippingInfoUpdatePost(orderId, shop.accessToken, 'application/json', credentials.shopCipher, fulfillment202309UpdateShippingInfoRequestBody);
            console.log('response: ', JSON.stringify(result, null, 2));
            return NextResponse.json(result.body.message);

        } catch (error) {
            console.error(`Error processing shop ${shop.shopId}:`, error);
            return NextResponse.json({ error: `Error processing shop ${shop.shopId}` }, { status: 500 });
        }

        return NextResponse.json("ok");
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}