import {NextRequest, NextResponse} from "next/server";
import {TikTokShopNodeApiClient} from "@/nodejs_sdk";
import { PrismaClient, Channel } from "@prisma/client";

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
        const whereClause: any = { 
            status: "ACTIVE",
            app: { channel: 'TIKTOK' } // Only get TikTok shops
        };
        
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

        let totalStatementsSynced = 0;
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

                // Fetch all pages of statements for this shop
                const allStatements = await fetchAllStatements(client, credentials, statementTimeGe, statementTimeLt);
                console.log(`Fetched ${allStatements.length} statements for shop ${shop.shopId}`);

                // Sync statements in batches
                const syncedCount = await syncStatementsToDatabase(allStatements, shop.id); // Use ObjectId instead of shopId
                totalStatementsSynced += syncedCount;

                shopResults.push({
                    shopId: shop.shopId,
                    shopName: shop.shopName,
                    statementsProcessed: allStatements.length,
                    statementsSynced: syncedCount
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
            "PAID",
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
                        "PAID",
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
        await prisma.$transaction(async (tx) => {
            // Get existing statement IDs
            const statementIds = statements.map(s => s.id).filter(Boolean);
            const existingStatements = await tx.statement.findMany({
                where: { statementId: { in: statementIds } },
                select: { statementId: true }
            });
            
            const existingStatementIds = new Set(existingStatements.map(s => s.statementId));

            // Separate new statements from updates
            const newStatements = [];
            const updateStatements = [];

            for (const statement of statements) {
                if (!statement.id) continue;

                // Prepare channelData for TikTok-specific fields
                const channelData = {
                    revenueAmount: statement.revenueAmount,
                    feeAmount: statement.feeAmount,
                    adjustmentAmount: statement.adjustmentAmount,
                    netSalesAmount: statement.netSalesAmount,
                    shippingCostAmount: statement.shippingCostAmount,
                };

                const statementData = {
                    statementId: statement.id,
                    channel: Channel.TIKTOK, // Use enum value
                    statementTime: statement.statementTime ?? 0,
                    settlementAmount: statement.settlementAmount,
                    currency: statement.currency,
                    channelData: JSON.stringify(channelData), // Store TikTok-specific data as JSON
                    paymentStatus: statement.paymentStatus,
                    paymentId: statement.paymentId,
                    shopId: shopObjectId, // Use ObjectId reference
                };

                if (existingStatementIds.has(statement.id)) {
                    updateStatements.push(statementData);
                } else {
                    newStatements.push(statementData);
                }
            }

            // Batch create new statements
            if (newStatements.length > 0) {
                await tx.statement.createMany({
                    data: newStatements,
                });
                syncedCount += newStatements.length;
            }

            // Batch update existing statements
            if (updateStatements.length > 0) {
                const updatePromises = updateStatements.map(statement => 
                    tx.statement.update({
                        where: { statementId: statement.statementId },
                        data: statement,
                    })
                );
                await Promise.all(updatePromises);
                syncedCount += updateStatements.length;
            }

        }, {
            maxWait: 30000,
            timeout: 60000,
        });

    } catch (error) {
        console.error(`Error processing statement batch for shop ${shopObjectId}:`, error);
    }

    return syncedCount;
}