// Create POST function to split order
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { Fulfillment202309SplitOrdersRequestBody, Fulfillment202309SplitOrdersRequestBodySplittableGroups, TikTokShopNodeApiClient } from '@/nodejs_sdk';

const prisma = new PrismaClient();

export async function POST(request: Request) {
    try {
        const { shop_id, order_id, splittable_groups } = await request.json();

        if (!shop_id || !order_id || !Array.isArray(splittable_groups) || splittable_groups.length === 0) {
            return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
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

        const fulfillment202309SplitOrdersRequestBody = new Fulfillment202309SplitOrdersRequestBody();

        for (const group of splittable_groups) {
            const groupObj = new Fulfillment202309SplitOrdersRequestBodySplittableGroups();
            groupObj.id = group.id;
            groupObj.orderLineItemIds = group.order_line_item_ids;
            fulfillment202309SplitOrdersRequestBody.splittableGroups = fulfillment202309SplitOrdersRequestBody.splittableGroups || [];
            fulfillment202309SplitOrdersRequestBody.splittableGroups.push(groupObj);
        }
        const response = await client.api.FulfillmentV202309Api.OrdersOrderIdSplitPost(order_id, credentials.accessToken, "application/json", shopCipher, fulfillment202309SplitOrdersRequestBody);

        const { body } = response;

        if (body.code !== 0) {
            console.error('TikTok API error:', body.message);
            return NextResponse.json({ error: 'TikTok API error', details: body.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, data: body.data });
    } catch (error: any) {
        console.error('Error in split order:', error);
        return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
    }
}