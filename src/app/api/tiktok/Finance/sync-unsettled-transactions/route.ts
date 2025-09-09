import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getUserWithShopAccess } from "@/lib/auth";
import { TikTokShopNodeApiClient } from "@/nodejs_sdk";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
    try {
        const { user, accessibleShopIds, isAdmin } = await getUserWithShopAccess(req, prisma);

        const {
            shop_id,
            search_time_ge,
            search_time_lt,
            page_size = 50
        } = await req.json();

        // Enhanced validation with better error messages
        if (!shop_id) {
            return NextResponse.json(
                { 
                    error: "Missing shop_id",
                    message: "Please provide a valid shop_id in the request body"
                }, 
                { status: 400 }
            );
        }

        // Get shop configuration
        const shop = await prisma.shopAuthorization.findUnique({
            where: { id: shop_id },
            include: {
                app: true,
            },
        });

        // Check user access
        if (!isAdmin && !accessibleShopIds.includes(shop?.id || '')) {
            return NextResponse.json(
                { 
                    error: "Access denied",
                    message: `User does not have access to shop ${shop_id}`
                }, 
                { status: 403 }
            );
        }

        if (!shop) {
            return NextResponse.json(
                { error: "Shop not found", message: `Shop ${shop_id} not found in database` },
                { status: 404 }
            );
        }

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
            return NextResponse.json(
                { error: "Missing app information", message: `Shop ${shop_id} is missing app configuration` },
                { status: 500 }
            );
        }

        const credentials = {
            accessToken: shop.accessToken,
            shopCipher: shopCipher,
            app: {
                appKey: shop?.app?.appKey,
                appSecret: shop?.app?.appSecret,
            },
        };

        if (!credentials.accessToken || !credentials.shopCipher) {
            console.error(`Missing credentials for shop ${shop.shopId}`);
            return NextResponse.json(
                { 
                    error: "Incomplete shop credentials", 
                    message: `Shop ${shop_id} is missing access token or shop cipher` 
                }, 
                { status: 400 }
            );
        }

        const client = new TikTokShopNodeApiClient({
            config: {
                basePath: process.env.TIKTOK_BASE_URL,
                app_key: credentials.app.appKey,
                app_secret: credentials.app.appSecret,
            },
        });

        let processedCount = 0;
        let successCount = 0;
        let pageToken: string | undefined;
        const errors: string[] = [];

        console.log(`Starting sync of unsettled transactions for shop ${shop_id}`);

        const startTime = Date.now();

        do {
            try {
                const response = await client.api.FinanceV202507Api.OrdersUnsettledGet(
                    'order_create_time',
                    shop.accessToken,
                    'application/json',
                    pageToken,
                    page_size,
                    'ASC',
                    search_time_ge,
                    search_time_lt,
                    shop.shopCipher ?? undefined
                );

                const { body } = response;
                
                if (body.data?.transactions) {
                    for (const transaction of body.data.transactions) {
                        try {
                            processedCount++;
                            
                            await prisma.tiktokUnsettledTransaction.upsert({
                                where: {
                                    transactionId: transaction.id || ''
                                },
                                update: {
                                    adjustmentId: transaction.adjustmentId,
                                    adjustmentOrderId: transaction.adjustmentOrderId,
                                    currency: transaction.currency,
                                    estAdjustmentAmount: transaction.estAdjustmentAmount,
                                    estFeeTaxAmount: transaction.estFeeTaxAmount,
                                    estRevenueAmount: transaction.estRevenueAmount,
                                    estSettlementAmount: transaction.estSettlementAmount,
                                    estShippingCostAmount: transaction.estShippingCostAmount,
                                    estimatedSettlement: transaction.estimatedSettlement,
                                    feeTaxBreakdown: transaction.feeTaxBreakdown ? JSON.parse(JSON.stringify(transaction.feeTaxBreakdown)) : {},
                                    orderCreateTime: transaction.orderCreateTime ? new Date(transaction.orderCreateTime * 1000) : null,
                                    orderDeliveryTime: transaction.orderDeliveryTime ? new Date(transaction.orderDeliveryTime * 1000) : null,
                                    orderId: transaction.orderId,
                                    revenueBreakdown: transaction.revenueBreakdown ? JSON.parse(JSON.stringify(transaction.revenueBreakdown)) : {},
                                    shippingCostBreakdown: transaction.shippingCostBreakdown ? JSON.parse(JSON.stringify(transaction.shippingCostBreakdown)) : {},
                                    status: transaction.status,
                                    type: transaction.type,
                                    unsettledReason: transaction.unsettledReason,
                                    updatedAt: new Date()
                                },
                                create: {
                                    shopId: shop_id,
                                    transactionId: transaction.id || '',
                                    adjustmentId: transaction.adjustmentId,
                                    adjustmentOrderId: transaction.adjustmentOrderId,
                                    currency: transaction.currency,
                                    estAdjustmentAmount: transaction.estAdjustmentAmount,
                                    estFeeTaxAmount: transaction.estFeeTaxAmount,
                                    estRevenueAmount: transaction.estRevenueAmount,
                                    estSettlementAmount: transaction.estSettlementAmount,
                                    estShippingCostAmount: transaction.estShippingCostAmount,
                                    estimatedSettlement: transaction.estimatedSettlement,
                                    feeTaxBreakdown: transaction.feeTaxBreakdown ? JSON.parse(JSON.stringify(transaction.feeTaxBreakdown)) : {},
                                    orderCreateTime: transaction.orderCreateTime ? new Date(transaction.orderCreateTime * 1000) : null,
                                    orderDeliveryTime: transaction.orderDeliveryTime ? new Date(transaction.orderDeliveryTime * 1000) : null,
                                    orderId: transaction.orderId,
                                    revenueBreakdown: transaction.revenueBreakdown ? JSON.parse(JSON.stringify(transaction.revenueBreakdown)) : {},
                                    shippingCostBreakdown: transaction.shippingCostBreakdown ? JSON.parse(JSON.stringify(transaction.shippingCostBreakdown)) : {},
                                    status: transaction.status,
                                    type: transaction.type,
                                    unsettledReason: transaction.unsettledReason
                                }
                            });
                            
                            successCount++;
                        } catch (error: any) {
                            errors.push(`Failed to save transaction ${transaction.id}: ${error.message}`);
                        }
                    }
                }

                pageToken = body.data?.nextPageToken;
                
            } catch (apiError: any) {
                errors.push(`API call failed: ${apiError.message}`);
                break;
            }
        } while (pageToken);

        const executionTime = Date.now() - startTime;
        console.log(`Sync completed. Processed: ${processedCount}, Success: ${successCount}, Errors: ${errors.length}`);

        return NextResponse.json({
            success: true,
            shop_id,
            processed: processedCount,
            successful: successCount,
            failed: errors.length,
            errors,
            execution_time_ms: executionTime,
            summary: `Successfully synced ${successCount}/${processedCount} unsettled transactions in ${executionTime}ms`
        });

    } catch (err: any) {
        console.error("Error syncing unsettled transactions:", err);
        return NextResponse.json({ 
            error: err.message || "Internal error",
            message: "An unexpected error occurred while syncing unsettled transactions",
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}
