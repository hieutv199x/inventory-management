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

        if (!shop_id || !order_id ) {
            return NextResponse.json(
                { error: "Missing required fields: shop_id, access_token, cipher" },
                { status: 400 }
            );
        }

        // Lấy thông tin shop và app
        const credentials = await prisma.shopAuthorization.findUnique({
            where: {
                shopId: shop_id,
            },
            include: {
                app: true,
            },
        });

        if (!credentials) {
            return NextResponse.json({ error: "Shop not found" }, { status: 404 });
        }

        const app_key = credentials.app.appKey;
        const app_secret = credentials.app.appSecret;
        const baseUrl = process.env.TIKTOK_BASE_URL;

        const client = new TikTokShopNodeApiClient({
            config: {
                basePath: baseUrl,
                app_key: app_key,
                app_secret: app_secret,
            },
        });
        const result = await client.api.OrderV202407Api.OrdersOrderIdPriceDetailGet(order_id, credentials.accessToken, "application/json", credentials.shopCipher);
        console.log('response: ', JSON.stringify(result, null, 2));

        return NextResponse.json(result);
    } catch (err: any) {
        console.error("Error getting orders:", err);
        return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 });
    }
}