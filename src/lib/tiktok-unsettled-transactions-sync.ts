import { PrismaClient } from "@prisma/client";
import { TikTokShopNodeApiClient } from "@/nodejs_sdk";

export interface UnsettledTransactionSyncOptions {
    shop_id: string;
    search_time_ge?: number;
    search_time_lt?: number;
    page_size?: number;
}

export interface UnsettledTransactionSyncResult {
    success: boolean;
    shop_id: string;
    processed: number;
    successful: number;
    failed: number;
    errors: string[];
    execution_time_ms: number;
    summary: string;
}

export class TikTokUnsettledTransactionSync {
    private prisma: PrismaClient;

    constructor(prisma: PrismaClient) {
        this.prisma = prisma;
    }

    async syncUnsettledTransactions(options: UnsettledTransactionSyncOptions): Promise<UnsettledTransactionSyncResult> {
        const startTime = Date.now();
        let processedCount = 0;
        let successCount = 0;
        const errors: string[] = [];

        try {
            // Get shop configuration
            let shop;
            try {
                shop = await this.prisma.shopAuthorization.findUnique({
                    where: { id: options.shop_id },
                    include: { app: true }
                });
            } catch (dbError) {
                shop = await this.prisma.shopAuthorization.findUnique({
                    where: { shopId: options.shop_id },
                    include: { app: true }
                });                
            }

            if (!shop) {
                throw new Error(`Shop ${options.shop_id} not found in database`);
            }

            if (!shop.app) {
                throw new Error(`Shop ${options.shop_id} is missing app configuration`);
            }

            // Extract shop cipher
            let shopCipher = shop.shopCipher;
            if (shop.channelData) {
                try {
                    const channelData = JSON.parse(shop.channelData);
                    shopCipher = channelData.shopCipher || shopCipher;
                } catch (error) {
                    console.warn(`Failed to parse channelData for shop ${shop.shopId}, using legacy shopCipher`);
                }
            }

            if (!shop.accessToken || !shopCipher) {
                throw new Error(`Shop ${options.shop_id} is missing access token or shop cipher`);
            }

            // Initialize TikTok client
            const client = new TikTokShopNodeApiClient({
                config: {
                    basePath: shop.app.BaseUrl ?? process.env.TIKTOK_BASE_URL,
                    app_key: shop.app.appKey,
                    app_secret: shop.app.appSecret,
                },
            });

            console.log(`Starting sync of unsettled transactions for shop ${options.shop_id}`);

            // Fetch and process transactions
            let pageToken: string | undefined;
            const pageSize = options.page_size || 50;

            do {
                try {
                    const response = await client.api.FinanceV202507Api.OrdersUnsettledGet(
                        'order_create_time',
                        shop.accessToken,
                        'application/json',
                        pageToken,
                        pageSize,
                        'ASC',
                        options.search_time_ge,
                        options.search_time_lt,
                        shopCipher ?? undefined
                    );

                    const { body } = response;

                    if (body.data?.transactions) {
                        for (const transaction of body.data.transactions) {
                            try {
                                processedCount++;
                                await this.saveTransaction(options.shop_id, transaction);
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

            return {
                success: errors.length === 0,
                shop_id: options.shop_id,
                processed: processedCount,
                successful: successCount,
                failed: errors.length,
                errors,
                execution_time_ms: executionTime,
                summary: `Successfully synced ${successCount}/${processedCount} unsettled transactions in ${executionTime}ms`
            };

        } catch (error: any) {
            const executionTime = Date.now() - startTime;
            errors.push(error.message);

            return {
                success: false,
                shop_id: options.shop_id,
                processed: processedCount,
                successful: successCount,
                failed: errors.length,
                errors,
                execution_time_ms: executionTime,
                summary: `Sync failed: ${error.message}`
            };
        }
    }

    private async saveTransaction(shopId: string, transaction: any): Promise<void> {
        await this.prisma.tiktokUnsettledTransaction.upsert({
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
                shopId: shopId,
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
    }
}

// Convenience function for easy usage
export async function syncUnsettledTransactions(
    prisma: PrismaClient,
    options: UnsettledTransactionSyncOptions
): Promise<UnsettledTransactionSyncResult> {
    const sync = new TikTokUnsettledTransactionSync(prisma);
    return sync.syncUnsettledTransactions(options);
}
