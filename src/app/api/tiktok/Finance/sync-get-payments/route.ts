import { NextRequest, NextResponse } from "next/server";
import {TikTokShopNodeApiClient} from "@/nodejs_sdk";
import { PrismaClient, Channel } from "@prisma/client";

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
            where: { 
                status: 'ACTIVE',
                app: { channel: 'TIKTOK' } // Only get TikTok shops
            },
            include: { app: true },
        });

        let totalPaymentsSynced = 0;
        const shopResults = [];

        for (const shop of shops) {
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
                    continue;
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
                const syncedCount = await syncPaymentsToDatabase(allPayments, shop.id); // Use ObjectId instead of shopId
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

async function syncPaymentsToDatabase(payments: any[], shopObjectId: string) {
    const BATCH_SIZE = 100;
    let totalSynced = 0;

    console.log(`Starting sync of ${payments.length} payments for shop ${shopObjectId} in batches of ${BATCH_SIZE}`);

    // Process payments in batches
    for (let i = 0; i < payments.length; i += BATCH_SIZE) {
        const batch = payments.slice(i, i + BATCH_SIZE);
        const syncedCount = await processPaymentBatch(batch, shopObjectId);
        totalSynced += syncedCount;
        console.log(`Processed ${Math.min(i + BATCH_SIZE, payments.length)} of ${payments.length} payments for shop ${shopObjectId}. Synced: ${syncedCount}`);
    }

    console.log(`Payment sync completed for shop ${shopObjectId}. Total synced: ${totalSynced}`);
    return totalSynced;
}

async function processPaymentBatch(payments: any[], shopObjectId: string) {
    let syncedCount = 0;

    try {
        console.log(`Processing batch of ${payments.length} payments for shop ${shopObjectId}`);
        
        // Log payment structure for debugging
        if (payments.length > 0) {
            console.log('Sample payment structure:', JSON.stringify(payments[0], null, 2));
        }

        // Get existing payment IDs to avoid duplicates (optional pre-check for logging)
        const paymentIds = payments.map(p => p.id).filter(Boolean);
        console.log(`Payment IDs from batch: [${paymentIds.join(', ')}]`);
        
        const existingPayments = await prisma.payment.findMany({
            where: { paymentId: { in: paymentIds } },
            select: { paymentId: true }
        });
        
        const existingPaymentIds = new Set(existingPayments.map(p => p.paymentId));
        console.log(`Existing payment IDs in database: [${Array.from(existingPaymentIds).join(', ')}]`);

        // Filter out existing payments
        const newPayments = payments.filter(payment => {
            if (!payment.id) {
                console.log(`Payment missing ID:`, payment);
                return false;
            }
            if (existingPaymentIds.has(payment.id)) {
                console.log(`Payment ${payment.id} already exists in database`);
                return false;
            }
            return true;
        });

        console.log(`New payments to insert: ${newPayments.length}`);

        if (newPayments.length > 0) {
            // Prepare batch data
            const paymentData = newPayments.map((payment, index) => {
                // Validate required fields
                if (!payment.status) {
                    console.warn(`Payment ${payment.id} missing status field`);
                }
                if (!payment.amount?.currency) {
                    console.warn(`Payment ${payment.id} missing amount currency`);
                }

                // Prepare channelData for TikTok-specific fields
                const channelData = {
                    reserveAmountValue: payment.reserveAmount?.value,
                    reserveAmountCurrency: payment.reserveAmount?.currency,
                    paymentBeforeExchangeValue: payment.paymentAmountBeforeExchange?.value,
                    paymentBeforeExchangeCurrency: payment.paymentAmountBeforeExchange?.currency,
                    exchangeRate: payment.exchangeRate,
                };

                const paymentRecord = {
                    paymentId: payment.id!,
                    channel: Channel.TIKTOK, // Add channel field
                    createTime: payment.createTime ?? 0,
                    status: payment.status!,
                    amountValue: payment.amount?.value,
                    amountCurrency: payment.amount?.currency ?? "",
                    settlementAmountValue: payment.settlementAmount?.value,
                    settlementAmountCurrency: payment.settlementAmount?.currency ?? "",
                    channelData: JSON.stringify(channelData), // Store TikTok-specific data as JSON
                    paidTime: payment.paidTime,
                    bankAccount: payment.bankAccount ?? null,
                    shopId: shopObjectId, // Use ObjectId reference
                };

                if (index === 0) {
                    console.log('Sample payment record to insert:', JSON.stringify(paymentRecord, null, 2));
                }

                return paymentRecord;
            });

            console.log(`About to insert ${paymentData.length} payment records (skipDuplicates enabled)`);

            // Batch create payments
            const result = await prisma.payment.createMany({
                data: paymentData
            });

            console.log(`Successfully inserted ${result.count} payment records`);
            syncedCount = result.count;
        } else {
            console.log('No new payments to insert (all were filtered out)');
        }
    } catch (error) {
        console.error(`Error processing payment batch for shop ${shopObjectId}:`, error);
        if (error instanceof Error) {
            console.error('Error details:', error.message);
            console.error('Error stack:', error.stack);
        }
    }

    return syncedCount;
}