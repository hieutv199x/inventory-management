import { NextRequest, NextResponse } from "next/server";
import { Finance202501GetTransactionsbyStatementResponseDataTransactions, TikTokShopNodeApiClient, Finance202501GetTransactionsbyStatementResponse } from "@/nodejs_sdk";
import { PrismaClient, Channel } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const statementTimeGe = parseInt(searchParams.get("statementTimeGe") || "0", 10);
        const statementTimeLt = parseInt(searchParams.get("statementTimeLt") || "0", 10);
        const shopId = searchParams.get("shopId");
        const syncTransactions = searchParams.get("syncTransactions") !== "false"; // Default to true

        if (!statementTimeGe || !statementTimeLt) {
            return NextResponse.json(
                { error: "Missing or invalid statementTimeGe or statementTimeLt" },
                { status: 400 }
            );
        }

        // Build where clause for shop filtering
        const whereClause: any = {
            status: "ACTIVE",
            app: { channel: 'TIKTOK' } // Only get TikTok shops
        };

        // Add shopId filter if provided
        if (shopId) {
            whereClause.id = shopId;
        }

        // Lấy thông tin shop và app với filter shopId
        const shops = await prisma.shopAuthorization.findMany({
            where: whereClause,
            include: {
                app: true,
            },
        });

        // Log which shops will be synced
        console.log(`Syncing statements${syncTransactions ? ' and transactions' : ''} for ${shops.length} shop(s)${shopId ? ` (shopId: ${shopId})` : ''} from ${statementTimeGe} to ${statementTimeLt}`);

        let totalStatementsSynced = 0;
        let totalTransactionsSynced = 0;
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
                    shopResults.push({
                        shopId: shop.shopId,
                        shopName: shop.shopName,
                        error: 'Missing app information'
                    });
                    continue;
                }

                const credentials = {
                    accessToken: shop.accessToken,
                    shopCipher: shopCipher,
                    app: {
                        appKey: shop.app.appKey,
                        appSecret: shop.app.appSecret,
                        BaseUrl: shop.app.BaseUrl,
                    },
                };

                if (!credentials.accessToken || !credentials.shopCipher) {
                    console.error(`Missing credentials for shop ${shop.shopId}`);
                    continue;
                }
                let basePath = process.env.TIKTOK_BASE_URL;
                if (credentials.app?.BaseUrl) {
                    basePath = credentials.app.BaseUrl;
                }
                const client = new TikTokShopNodeApiClient({
                    config: {
                        basePath: basePath,
                        app_key: credentials.app.appKey,
                        app_secret: credentials.app.appSecret,
                    },
                });

                // Fetch all pages of statements for this shop
                const allStatements = await fetchAllStatements(client, credentials, statementTimeGe, statementTimeLt);
                console.log(`Fetched ${allStatements.length} statements for shop ${shop.shopId}`);

                // Sync statements in batches
                const syncedCount = await syncStatementsToDatabase(allStatements, shop.id); // Use ObjectId instead of shopId
                totalStatementsSynced += syncedCount;

                let transactionsSynced = 0;
                if (syncTransactions && allStatements.length > 0) {
                    // Fetch and sync transactions for all statements
                    const allTransactions = await fetchTransactionsForStatements(client, credentials, allStatements);
                    console.log(`Fetched ${allTransactions.length} transactions for shop ${shop.shopId}`);

                    transactionsSynced = await syncTransactionsToDatabase(allTransactions, shop.shopId);
                    totalTransactionsSynced += transactionsSynced;
                }

                shopResults.push({
                    shopId: shop.shopId,
                    shopName: shop.shopName,
                    statementsProcessed: allStatements.length,
                    statementsSynced: syncedCount,
                    transactionsSynced: syncTransactions ? transactionsSynced : 'skipped'
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
            totalStatementsSynced,
            totalTransactionsSynced: syncTransactions ? totalTransactionsSynced : 'skipped',
            syncedShops: shops.length,
            shopId: shopId || 'all',
            shopResults
        });
    } catch (err: unknown) {
        console.error("Error syncing TikTok statements:", err);
        return NextResponse.json(
            { error: err instanceof Error ? err.message : "Internal Server Error" },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}

async function fetchAllStatements(client: any, credentials: any, statementTimeGe: number, statementTimeLt: number) {
    let allStatements = [];
    const pageSize = 50;
    let nextPageToken = "";

    try {
        // Get first page
        const result = await client.api.FinanceV202309Api.StatementsGet(
            "statement_time",
            credentials.accessToken,
            "application/json",
            statementTimeLt,
            undefined,
            pageSize,
            nextPageToken,
            "ASC",
            statementTimeGe,
            credentials.shopCipher
        );

        if (result?.body.data?.statements && Array.isArray(result.body.data.statements)) {
            allStatements.push(...result.body.data.statements);
            nextPageToken = result.body.data.nextPageToken;

            // Continue fetching all pages
            while (nextPageToken) {
                try {
                    console.log(`Fetching next page of statements with token: ${nextPageToken}`);

                    const nextPageResult = await client.api.FinanceV202309Api.StatementsGet(
                        "statement_time",
                        credentials.accessToken,
                        "application/json",
                        statementTimeLt,
                        undefined,
                        pageSize,
                        nextPageToken,
                        "ASC",
                        statementTimeGe,
                        credentials.shopCipher
                    );

                    if (nextPageResult?.body.data?.statements && Array.isArray(nextPageResult.body.data.statements)) {
                        allStatements.push(...nextPageResult.body.data.statements);
                        console.log(`Fetched ${nextPageResult.body.data.statements.length} more statements. Total: ${allStatements.length}`);
                    }

                    nextPageToken = nextPageResult.body?.data?.nextPageToken;

                    // Add delay to avoid rate limiting
                    await new Promise(resolve => setTimeout(resolve, 100));

                } catch (paginationError) {
                    console.error('Error fetching next page of statements:', paginationError);
                    break;
                }
            }
        }
    } catch (error) {
        console.error('Error fetching statements:', error);
    }

    return allStatements;
}

async function syncStatementsToDatabase(statements: any[], shopObjectId: string) {
    const BATCH_SIZE = 100;
    let totalSynced = 0;

    console.log(`Starting sync of ${statements.length} statements for shop ${shopObjectId} in batches of ${BATCH_SIZE}`);

    // Process statements in batches
    for (let i = 0; i < statements.length; i += BATCH_SIZE) {
        const batch = statements.slice(i, i + BATCH_SIZE);
        const syncedCount = await processStatementBatch(batch, shopObjectId);
        totalSynced += syncedCount;
        console.log(`Processed ${Math.min(i + BATCH_SIZE, statements.length)} of ${statements.length} statements for shop ${shopObjectId}. Synced: ${syncedCount}`);
    }

    console.log(`Statement sync completed for shop ${shopObjectId}. Total synced: ${totalSynced}`);
    return totalSynced;
}

async function processStatementBatch(statements: any[], shopObjectId: string) {
    let syncedCount = 0;

    try {
        // Removed prisma.$transaction for MongoDB compatibility (non-atomic now)
        const statementIds = statements.map(s => s.id).filter(Boolean);
        const existingStatements = await prisma.statement.findMany({
            where: { statementId: { in: statementIds } },
            select: { statementId: true }
        });

        const existingStatementIds = new Set(existingStatements.map(s => s.statementId));
        const newStatements: any[] = [];
        const updateStatements: any[] = [];

        for (const statement of statements) {
            if (!statement.id) continue;

            const channelData = {
                revenueAmount: statement.revenueAmount,
                feeAmount: statement.feeAmount,
                adjustmentAmount: statement.adjustmentAmount,
                netSalesAmount: statement.netSalesAmount,
                shippingCostAmount: statement.shippingCostAmount,
            };

            const statementData = {
                statementId: statement.id,
                channel: Channel.TIKTOK,
                statementTime: statement.statementTime ?? 0,
                settlementAmount: statement.settlementAmount,
                currency: statement.currency,
                channelData: JSON.stringify(channelData),
                paymentStatus: statement.paymentStatus,
                paymentId: statement.paymentId,
                shopId: shopObjectId,
            };

            if (existingStatementIds.has(statement.id)) {
                updateStatements.push(statementData);
            } else {
                newStatements.push(statementData);
            }
        }

        if (newStatements.length > 0) {
            await prisma.statement.createMany({
                data: newStatements
            });
            syncedCount += newStatements.length;
        }

        if (updateStatements.length > 0) {
            await Promise.all(
                updateStatements.map(s =>
                    prisma.statement.update({
                        where: { statementId: s.statementId },
                        data: s
                    })
                )
            );
            syncedCount += updateStatements.length;
        }

    } catch (error) {
        console.error(`Error processing statement batch for shop ${shopObjectId}:`, error);
    }

    return syncedCount;
}

async function fetchTransactionsForStatements(client: any, credentials: any, statements: any[]) {
    const allTransactions: (Finance202501GetTransactionsbyStatementResponseDataTransactions & { statementId: string, currency: string, createdTime: number })[] = [];

    for (const statement of statements) {
        if (!statement.id) continue;

        try {
            console.log(`Fetching transactions for statement ${statement.id}`);

            // Fetch all pages of transactions for this statement
            let nextPageToken = "";
            const pageSize = 50;

            do {
                const result: { response: any; body: Finance202501GetTransactionsbyStatementResponse } = await client.api.FinanceV202501Api.StatementsStatementIdStatementTransactionsGet(
                    statement.id,
                    "order_create_time",
                    credentials.accessToken,
                    "application/json",
                    nextPageToken,
                    "DESC",
                    pageSize,
                    credentials.shopCipher
                );

                if (result?.body?.data?.transactions && Array.isArray(result.body.data.transactions)) {
                    // Add statementId to each transaction for reference
                    const transactionsWithStatement = result.body.data.transactions.map((transaction: Finance202501GetTransactionsbyStatementResponseDataTransactions) => ({
                        ...transaction,
                        statementId: statement.id,
                        currency: statement.currency || 'GBP',
                        createdTime: statement.statementTime
                    } as Finance202501GetTransactionsbyStatementResponseDataTransactions & { statementId: string, currency: string, createdTime: number }));
                    allTransactions.push(...transactionsWithStatement);
                    console.log(`Fetched ${result.body.data.transactions.length} transactions for statement ${statement.id}`);
                }

                // SDK maps next_page_token to nextPageToken
                nextPageToken = result.body?.data?.nextPageToken || "";

                // Add delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 100));

            } while (nextPageToken);

        } catch (error) {
            console.error(`Error fetching transactions for statement ${statement.id}:`, error);
        }
    }

    return allTransactions;
}

async function syncTransactionsToDatabase(transactions: (Finance202501GetTransactionsbyStatementResponseDataTransactions & { statementId: string, currency: string, createdTime: number })[], shopId: string) {
    const BATCH_SIZE = 100;
    let totalSynced = 0;

    console.log(`Starting sync of ${transactions.length} transactions for shop ${shopId} in batches of ${BATCH_SIZE}`);

    // Process transactions in batches
    for (let i = 0; i < transactions.length; i += BATCH_SIZE) {
        const batch = transactions.slice(i, i + BATCH_SIZE);
        const syncedCount = await processTransactionBatch(batch, shopId);
        totalSynced += syncedCount;
        console.log(`Processed ${Math.min(i + BATCH_SIZE, transactions.length)} of ${transactions.length} transactions for shop ${shopId}. Synced: ${syncedCount}`);
    }

    console.log(`Transaction sync completed for shop ${shopId}. Total synced: ${totalSynced}`);
    return totalSynced;
}

async function processTransactionBatch(
    transactions: (Finance202501GetTransactionsbyStatementResponseDataTransactions & { statementId: string, currency: string, createdTime: number })[],
    shopId: string
) {
    let syncedCount = 0;

    try {
        // Removed prisma.$transaction for MongoDB compatibility (non-atomic now)
        const transactionIds = transactions
            .map(t => t.id)
            .filter((id): id is string => typeof id === 'string');

        const existingTransactions = await prisma.tikTokTransaction.findMany({
            where: { transactionId: { in: transactionIds } },
            select: { id: true, transactionId: true }
        });

        const existingTransactionMap = new Map(existingTransactions.map(t => [t.transactionId, t.id]));
        const newTransactions: any[] = [];
        const updateTransactions: any[] = [];

        for (const transaction of transactions) {
            if (!transaction.id) continue;

            const transactionData = {
                transactionId: transaction.id,
                shopId,
                statementId: transaction.statementId,
                type: transaction.type || '',
                currency: transaction.currency || 'GBP',
                settlementAmount: transaction.settlementAmount ? parseFloat(transaction.settlementAmount) : null,
                adjustmentAmount: transaction.adjustmentAmount ? parseFloat(transaction.adjustmentAmount) : null,
                revenueAmount: transaction.revenueAmount ? parseFloat(transaction.revenueAmount) : null,
                shippingCostAmount: transaction.shippingCostAmount ? parseFloat(transaction.shippingCostAmount) : null,
                feeTaxAmount: transaction.feeTaxAmount ? parseFloat(transaction.feeTaxAmount) : null,
                reserveAmount: transaction.reserveAmount ? parseFloat(transaction.reserveAmount) : null,
                createdTime: transaction.createdTime ? new Date(transaction.createdTime * 1000) : null,
                orderId: transaction.orderId || null,
                orderCreateTime: transaction.orderCreateTime ? new Date(transaction.orderCreateTime * 1000) : null,
                adjustmentId: transaction.adjustmentId || null,
                adjustmentOrderId: transaction.adjustmentOrderId || null,
                associatedOrderId: transaction.associatedOrderId || null,
                reserveId: transaction.reserveId || null,
                reserveStatus: transaction.reserveStatus || null,
                estimatedReleaseTime: transaction.estimatedReleaseTime ? new Date(parseInt(transaction.estimatedReleaseTime) * 1000) : null,
                revenueBreakdown: transaction.revenueBreakdown ? JSON.parse(JSON.stringify(transaction.revenueBreakdown)) : null,
                shippingCostBreakdown: transaction.shippingCostBreakdown ? JSON.parse(JSON.stringify(transaction.shippingCostBreakdown)) : null,
                feeTaxBreakdown: transaction.feeTaxBreakdown ? JSON.parse(JSON.stringify(transaction.feeTaxBreakdown)) : null,
                supplementaryComponent: transaction.supplementaryComponent ? JSON.parse(JSON.stringify(transaction.supplementaryComponent)) : null,
            };

            const existingId = existingTransactionMap.get(transaction.id);
            if (existingId) {
                updateTransactions.push({ ...transactionData, id: existingId });
            } else {
                newTransactions.push(transactionData);
            }
        }

        if (newTransactions.length > 0) {
            await prisma.tikTokTransaction.createMany({
                data: newTransactions
            });
            syncedCount += newTransactions.length;
        }

        if (updateTransactions.length > 0) {
            await Promise.all(
                updateTransactions.map(t => {
                    const { id, ...data } = t;
                    return prisma.tikTokTransaction.update({
                        where: { id },
                        data
                    });
                })
            );
            syncedCount += updateTransactions.length;
        }

    } catch (error) {
        console.error(`Error processing transaction batch for shop ${shopId}:`, error);
    }

    return syncedCount;
}