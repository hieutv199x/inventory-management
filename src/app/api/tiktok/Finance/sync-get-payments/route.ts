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
            where: { status: 'ACTIVE' },
            include: { app: true },
        });

        let totalPaymentsSynced = 0;
        const shopResults = [];

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

                // Fetch all pages of payments for this shop
                const allPayments = await fetchAllPayments(client, credentials, statementTimeGe, statementTimeLt);
                console.log(`Fetched ${allPayments.length} payments for shop ${shop.shopId}`);

                // Sync payments in batches
                const syncedCount = await syncPaymentsToDatabase(allPayments, shop.shopId);
                totalPaymentsSynced += syncedCount;

                shopResults.push({
                    shopId: shop.shopId,
                    shopName: shop.shopName,
                    paymentsProcessed: allPayments.length,
                    paymentsSynced: syncedCount
                });

            } catch (error) {
                console.error(`Error processing shop ${shop.shopId}:`, error);
                shopResults.push({
                    shopId: shop.shopId,
                    shopName: shop.shopName,
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }

        return NextResponse.json({ 
            success: true,
            totalPaymentsSynced,
            shopResults
        });
    } catch (err: unknown) {
        console.error("Error syncing TikTok payments:", err);
        return NextResponse.json(
            { error: err instanceof Error ? err.message : "Internal Server Error" },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}

async function fetchAllPayments(client: any, credentials: any, statementTimeGe: number, statementTimeLt: number) {
    let allPayments = [];
    const pageSize = 50;
    let nextPageToken = "";

    try {
        // Get first page
        const result = await client.api.FinanceV202309Api.PaymentsGet(
            "create_time",
            credentials.accessToken,
            "application/json",
            statementTimeLt,
            pageSize,
            nextPageToken,
            "ASC",
            statementTimeGe,
            credentials.shopCipher
        );

        if (result.body?.data?.payments) {
            allPayments.push(...result.body.data.payments);
            nextPageToken = result.body.data.nextPageToken;

            // Continue fetching all pages
            while (nextPageToken) {
                try {
                    console.log(`Fetching next page of payments with token: ${nextPageToken}`);
                    
                    const nextPageResult = await client.api.FinanceV202309Api.PaymentsGet(
                        "create_time",
                        credentials.accessToken,
                        "application/json",
                        statementTimeLt,
                        pageSize,
                        nextPageToken,
                        "ASC",
                        statementTimeGe,
                        credentials.shopCipher
                    );

                    if (nextPageResult.body?.data?.payments) {
                        allPayments.push(...nextPageResult.body.data.payments);
                        console.log(`Fetched ${nextPageResult.body.data.payments.length} more payments. Total: ${allPayments.length}`);
                    }

                    nextPageToken = nextPageResult.body?.data?.nextPageToken;
                    
                    // Add delay to avoid rate limiting
                    await new Promise(resolve => setTimeout(resolve, 100));
                    
                } catch (paginationError) {
                    console.error('Error fetching next page of payments:', paginationError);
                    break;
                }
            }
        }
    } catch (error) {
        console.error('Error fetching payments:', error);
    }

    return allPayments;
}

async function syncPaymentsToDatabase(payments: any[], shopId: string) {
    const BATCH_SIZE = 100;
    let totalSynced = 0;

    console.log(`Starting sync of ${payments.length} payments for shop ${shopId} in batches of ${BATCH_SIZE}`);

    // Process payments in batches
    for (let i = 0; i < payments.length; i += BATCH_SIZE) {
        const batch = payments.slice(i, i + BATCH_SIZE);
        const syncedCount = await processPaymentBatch(batch, shopId);
        totalSynced += syncedCount;
        console.log(`Processed ${Math.min(i + BATCH_SIZE, payments.length)} of ${payments.length} payments for shop ${shopId}. Synced: ${syncedCount}`);
    }

    console.log(`Payment sync completed for shop ${shopId}. Total synced: ${totalSynced}`);
    return totalSynced;
}

async function processPaymentBatch(payments: any[], shopId: string) {
    let syncedCount = 0;

    try {
        await prisma.$transaction(async (tx) => {
            // Get existing payment IDs to avoid duplicates
            const paymentIds = payments.map(p => p.id).filter(Boolean);
            const existingPayments = await tx.tikTokPayment.findMany({
                where: { paymentId: { in: paymentIds } },
                select: { paymentId: true }
            });
            
            const existingPaymentIds = new Set(existingPayments.map(p => p.paymentId));

            // Filter out existing payments
            const newPayments = payments.filter(payment => 
                payment.id && !existingPaymentIds.has(payment.id)
            );

            if (newPayments.length > 0) {
                // Prepare batch data
                const paymentData = newPayments.map(payment => ({
                    paymentId: payment.id!,
                    createTime: payment.createTime ?? 0,
                    status: payment.status!,
                    amountValue: payment.amount?.value,
                    amountCurrency: payment.amount?.currency ?? "",
                    settlementAmountValue: payment.settlementAmount?.value,
                    settlementAmountCurrency: payment.settlementAmount?.currency ?? "",
                    reserveAmountValue: payment.reserveAmount?.value,
                    reserveAmountCurrency: payment.reserveAmount?.currency ?? "",
                    paymentBeforeExchangeValue: payment.paymentAmountBeforeExchange?.value,
                    paymentBeforeExchangeCurrency: payment.paymentAmountBeforeExchange?.currency ?? "",
                    exchangeRate: payment.exchangeRate,
                    paidTime: payment.paidTime,
                    bankAccount: payment.bankAccount ?? null,
                    shopId: shopId,
                }));

                // Batch create payments
                await tx.tikTokPayment.createMany({
                    data: paymentData,
                });

                syncedCount = paymentData.length;
            }
        }, {
            maxWait: 30000,
            timeout: 60000,
        });

    } catch (error) {
        console.error(`Error processing payment batch for shop ${shopId}:`, error);
    }

    return syncedCount;
}