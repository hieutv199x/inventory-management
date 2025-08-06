import {  NextResponse } from "next/server";
import {TikTokShopNodeApiClient} from "@/nodejs_sdk";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
    try {

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1); 

        const statementTimeGe = Math.floor(yesterday.getTime() / 1000);

        const statementTimeLt = Math.floor(today.getTime() / 1000);

        // Lấy thông tin shop và app
         const shops = await prisma.shopAuthorization.findMany({
            include: {
            app: true,
            },
        });

        
        for (const shop of shops) {
            try {
                const credentials = {
                    accessToken: shop.accessToken,
                    shopCipher: shop.shopCipher,
                    app: {
                        appKey: shop.app.appKey,
                        appSecret: shop.app.appSecret,
                    },
                };

                if (!credentials.accessToken || !credentials.shopCipher) {
                    console.error(`Missing credentials for shop ${shop.shopId}`);
                    continue;
                }

                const client = new TikTokShopNodeApiClient({
                    config: {
                        basePath: process.env.TIKTOK_BASE_URL,
                        app_key: credentials.app.appKey,
                        app_secret: credentials.app.appSecret,
                    },
                });

               const result = await client.api.FinanceV202309Api.WithdrawalsGet(["WITHDRAW"], credentials.accessToken, "application/json", statementTimeLt, 20, "", statementTimeGe, credentials.shopCipher);
                console.log('response: ', JSON.stringify(result, null, 2));
            }
            catch (error) {
                console.error(`Error processing shop ${shop.shopId}:`, error);
            }
        }

    } catch (err: unknown) {
        console.error("Error syncing TikTok statements:", err);
        return NextResponse.json(
            { error: err instanceof Error ? err.message : "Internal Server Error" },
            { status: 500 }
        );
    }
}