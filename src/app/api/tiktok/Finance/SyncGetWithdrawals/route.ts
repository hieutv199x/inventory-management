import { NextRequest, NextResponse } from "next/server";
import {TikTokShopNodeApiClient} from "@/nodejs_sdk";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
    try {

        const { searchParams } = new URL(request.url);
                const statementTimeGe = parseInt(searchParams.get("statementTimeGe") || "0", 10);
                const statementTimeLt = parseInt(searchParams.get("statementTimeLt") || "0", 10);
        
                if (!statementTimeGe || !statementTimeLt) {
                    return NextResponse.json(
                        { error: "Missing or invalid statementTimeGe or statementTimeLt" },
                        { status: 400 }
                    );
                }
                // Lấy thông tin shop và app
                const shops = await prisma.shopAuthorization.findMany({
                    where: { status: "ACTIVE" },
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

                const result = await client.api.FinanceV202309Api.WithdrawalsGet([
                    "WITHDRAW"
                ], credentials.accessToken, "application/json", statementTimeLt, 20, "", statementTimeGe, credentials.shopCipher);
                console.log('response: ', JSON.stringify(result, null, 2));

                // Lưu dữ liệu vào DB nếu có data
                const withdrawals = result?.body.data?.withdrawals || [];
                for (const withdrawal of withdrawals) {
                    try {
                        const existing = await prisma.tikTokWithdrawal.findUnique({
                            where: { withdrawalId: withdrawal.id }
                        });
                        if (existing) {
                            continue; // Skip if already exists
                        }
                        await prisma.tikTokWithdrawal.create({
                            data: {
                                withdrawalId: withdrawal.id!,
                                createTime: withdrawal.createTime ?? 0,
                                status: withdrawal.status ?? "",
                                amount: parseFloat(withdrawal.amount ?? "0"),
                                currency: withdrawal.currency ?? "",
                                type: withdrawal.type ?? "",
                                createdAt: new Date(),
                                updatedAt: new Date(),
                                shopId: shop.shopId,
                            },
                        });
                    } catch (err) {
                        console.error(`❌ Lỗi khi lưu withdrawal ${withdrawal.id} cho shop ${shop.shopId}:`, err);
                    }
                }
            } catch (error) {
                console.error(`Error processing shop ${shop.shopId}:`, error);
            }
        }
        return NextResponse.json({ success: true });
    } catch (err: unknown) {
        console.error("Error syncing TikTok statements:", err);
        return NextResponse.json(
            { error: err instanceof Error ? err.message : "Internal Server Error" },
            { status: 500 }
        );
    }
}