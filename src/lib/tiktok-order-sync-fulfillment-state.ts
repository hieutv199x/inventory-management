import { PrismaClient } from "@prisma/client";
import { TikTokShopNodeApiClient } from "@/nodejs_sdk";

export class TikTokOrderAttributesSync {
    private prisma: PrismaClient;

    constructor(prisma: PrismaClient) {
        this.prisma = prisma;
    }

    async syncOrderCanSplit(options: any): Promise<any> {
        let processedCount = 0;
        let successCount = 0;
        const errors: string[] = [];

        try {
            // Get shop configuration
            const shop = await this.prisma.shopAuthorization.findUnique({
                where: { id: options.shop_id },
                include: { app: true }
            });

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

            const baseUrl = shop.app.BaseUrl ?? process.env.TIKTOK_BASE_URL;

            // Initialize TikTok client
            const client = new TikTokShopNodeApiClient({
                config: {
                    basePath: baseUrl,
                    app_key: shop.app.appKey,
                    app_secret: shop.app.appSecret,
                },
            });

            console.log(`Starting sync of order attributes for shop ${options.shop_id}`);

            try {
                const response = await client.api.FulfillmentV202309Api.OrdersSplitAttributesGet(
                    options.order_ids,
                    shop.accessToken,
                    'application/json',
                    shopCipher ?? undefined
                );

                const { body } = response;
                
                if (body.data?.splitAttributes) {
                    for (const attribute of body.data.splitAttributes) {
                        const order = await this.prisma.order.findFirst({
                            where: {
                                shopId: options.shop_id,
                                orderId: attribute.orderId
                            }
                        });

                        if (order) {
                            await this.prisma.order.update({
                                where: { id: order.id },
                                data: {
                                    canSplitPackages: attribute.canSplit || false,
                                    splitNotAllowedReason: attribute.reason || null,
                                    mustSplitPackages: attribute.mustSplit || false,
                                    mustSplitReasons: attribute.mustSplitReasons ? JSON.stringify(attribute.mustSplitReasons) : null,
                                    splitAttributesRaw: JSON.stringify(attribute)
                                }
                            });
                            successCount++;
                        } else {
                            errors.push(`Order ${attribute.orderId} not found for shop ${options.shop_id}`);
                        }
                    }
                }
            } catch (apiError: any) {
                errors.push(`API call failed: ${apiError.message}`);
            }

            console.log(`Sync tiktok shop order ${options.order_id} attributes completed. Processed: ${processedCount}, Success: ${successCount}, Errors: ${errors.length}`);

        } catch (error: any) {
            errors.push(error.message);
            console.error(`Sync failed: ${error.message}`);
        }
    }

}

// Convenience function for easy usage
export async function syncOrderCanSplitOrNot(
    prisma: PrismaClient,
    options: any
): Promise<any> {
    const sync = new TikTokOrderAttributesSync(prisma);
    return sync.syncOrderCanSplit(options);
}
