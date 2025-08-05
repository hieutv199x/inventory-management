import { NextRequest, NextResponse } from "next/server";
import {TikTokShopNodeApiClient} from "@/nodejs_sdk";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
    try {
        const shop_id = req.nextUrl.searchParams.get("shop_id");

        if (!shop_id ) {
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

        const result = await client.api.FinanceV202309Api.StatementsGet("statement_time", credentials.accessToken, "application/json", 1623812664, "PAID", 20, "", "ASC", 1623812664, credentials.shopCipher);
        console.log('response: ', JSON.stringify(result, null, 2));


        return NextResponse.json(result);

    } catch (err: any) {
        console.error("Error syncing TikTok statements:", err);
        return NextResponse.json(
            { error: err.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}