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

        const shops = await prisma.shopAuthorization.findMany({
            include: { app: true },
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

                const result = await client.api.FinanceV202309Api.PaymentsGet("create_time", credentials.accessToken, "application/json", statementTimeLt, 20, "", "ASC", statementTimeGe, credentials.shopCipher);
                console.log('response: ', JSON.stringify(result, null, 2));
                const payments = result.body?.data?.payments || [];

                for (const payment of payments) {
                    try {
                        const existing = await prisma.tikTokPayment.findUnique({
                            where: { paymentId: payment.id! }
                        });
                        if (existing) {
                            continue; // Skip if already exists
                        }
                        await prisma.tikTokPayment.create({
                        data: {
                            paymentId: payment.id!,
                            createTime: payment.createTime ?? 0,
                            status: payment.status!,
                            amountValue: payment.amount?.value,
                            amountCurrency: payment.amount?.currency ?? "",
                            settlementAmountValue: payment.settlementAmount?.value,
                            settlementAmountCurrency: payment.settlementAmount?.currency ?? "",
                            reserveAmountValue: payment.reserveAmount?.value,
                            reserveAmountCurrency: payment.reserveAmount?.currency ?? "",
                            paymentBeforeExchangeValue: payment.paymentAmountBeforeExchange?.value ,
                            paymentBeforeExchangeCurrency: payment.paymentAmountBeforeExchange?.currency ?? "",
                            exchangeRate: payment.exchangeRate,
                            paidTime: payment.paidTime,
                            bankAccount: payment.bankAccount ?? null,
                            shopId: shop.shopId,
                        },
                    });
                    } catch (err) {
                        console.error(`❌ Lỗi khi lưu payment ${payment.id} cho shop ${shop.shopId}:`, err);
                    }
                }
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