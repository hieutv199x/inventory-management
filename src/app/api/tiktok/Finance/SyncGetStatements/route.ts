import {NextRequest, NextResponse} from "next/server";
import {TikTokShopNodeApiClient} from "@/nodejs_sdk";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const statementTimeGe = parseInt(searchParams.get("statementTimeGe") || "0", 10);
        const statementTimeLt = parseInt(searchParams.get("statementTimeLt") || "0", 10);
        const shopId = searchParams.get("shopId"); // Add shopId parameter

        if (!statementTimeGe || !statementTimeLt) {
            return NextResponse.json(
                { error: "Missing or invalid statementTimeGe or statementTimeLt" },
                { status: 400 }
            );
        }

        // Build where clause for shop filtering
        const whereClause: any = { status: "ACTIVE" };
        
        // Add shopId filter if provided
        if (shopId) {
            whereClause.shopId = shopId;
        }

        // Lấy thông tin shop và app với filter shopId
        const shops = await prisma.shopAuthorization.findMany({
            where: whereClause,
            include: {
                app: true,
            },
        });

        // Log which shops will be synced
        console.log(`Syncing statements for ${shops.length} shop(s)${shopId ? ` (shopId: ${shopId})` : ''} from ${statementTimeGe} to ${statementTimeLt}`);

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

                const result = await client.api.FinanceV202309Api.StatementsGet(
                    "statement_time",
                    credentials.accessToken,
                    "application/json",
                    statementTimeLt,
                    "PAID",
                    50,
                    "",
                    "ASC",
                    statementTimeGe,
                    credentials.shopCipher
                );
                console.log('response: ', JSON.stringify(result, null, 2));
                // Lưu dữ liệu vào DB
                if (result?.body.data?.statements && Array.isArray(result.body.data.statements)) {
                    for (const statement of result.body.data.statements) {
                        await prisma.tikTokStatement.upsert({
                            where: { statementId: statement.id }, // Giả sử có trường statement_id
                            update: { ...statement, shopId: shop.shopId },
                            create: {
                                ...statement, 
                                shopId: shop.shopId, 
                                statementId: statement.id!, 
                                statementTime: statement.statementTime ?? 0 
                            },
                        });
                    }
                }
            }
            catch (error) {
                console.error(`Error processing shop ${shop.shopId}:`, error);
            }
        }
        return NextResponse.json({ 
            success: true, 
            syncedShops: shops.length,
            shopId: shopId || 'all'
        });
    } catch (err: unknown) {
        console.error("Error syncing TikTok statements:", err);
        return NextResponse.json(
            { error: err instanceof Error ? err.message : "Internal Server Error" },
            { status: 500 }
        );
    }
}