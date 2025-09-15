import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import {
    TikTokShopNodeApiClient,
} from "@/nodejs_sdk";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
    try {
        const shop_id = req.nextUrl.searchParams.get("shop_id");
        const order_id = req.nextUrl.searchParams.get("order_id");

        if (!shop_id || !order_id) {
            return NextResponse.json(
                { error: "Missing required fields: shop_id, order_id" },
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

        const result = await client.api.FulfillmentV202309Api.OrdersSplitAttributesGet(
            [order_id],
            credentials.accessToken,
            "application/json",
            shopCipher
        );
        
        console.log('response: ', JSON.stringify(result, null, 2));


        return NextResponse.json({
            api: result?.body
        });
    } catch (err: any) {
        console.error("Error getting orders:", err);
        return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 });
    }
}