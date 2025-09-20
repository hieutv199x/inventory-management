import { PrismaClient, Channel, NotificationType } from "@prisma/client";
import { TikTokShopNodeApiClient, Order202309GetOrderListRequestBody } from "@/nodejs_sdk";
import { NotificationService } from "@/lib/notification-service";
import { syncOrderCanSplitOrNot } from "./tiktok-order-sync-fulfillment-state";

const prisma = new PrismaClient();

export interface OrderSyncOptions {
    shop_id: string;
    order_ids?: string[];
    sync_all?: boolean;
    create_time_ge?: number;
    create_time_lt?: number;
    update_time_ge?: number;
    update_time_lt?: number;
    page_size?: number;
    include_price_detail?: boolean;
    create_notifications?: boolean;
    timeout_seconds?: number;
}

export interface OrderSyncResult {
    success: boolean;
    shopId: string;
    shopName?: string;
    totalOrdersProcessed: number;
    ordersCreated: number;
    ordersUpdated: number;
    ordersWithPriceDetails: number;
    errors: { orderId: string; error: string }[];
    executionTimeMs: number;
    error?: string;
}

export class TikTokOrderSync {
    public client: TikTokShopNodeApiClient;
    public credentials: any;
    public shopCipher: string | undefined;

    private MAX_RETRIES = 2;
    private RETRY_BASE_DELAY_MS = 300;

    constructor(client: TikTokShopNodeApiClient, credentials: any, shopCipher?: string) {
        this.client = client;
        this.credentials = credentials;
        this.shopCipher = shopCipher;
    }

    static async create(shop_id: string): Promise<TikTokOrderSync> {
        // Get shop credentials
        const credentials = await prisma.shopAuthorization.findUnique({
            where: {
                shopId: shop_id,
                status: 'ACTIVE',
            },
            include: { app: true },
        });

        if (!credentials) {
            throw new Error("Shop not found or inactive");
        }

        if (credentials.app?.channel !== 'TIKTOK') {
            throw new Error("Not a TikTok shop");
        }

        // Extract shopCipher from channelData
        let shopCipher: string | undefined = credentials.shopCipher ?? undefined;
        if (credentials.channelData) {
            try {
                const channelData = JSON.parse(credentials.channelData);
                shopCipher = channelData.shopCipher ?? shopCipher ?? undefined;
            } catch (error) {
                console.warn('Failed to parse channelData, using legacy shopCipher');
            }
        }
        const baseUrl = credentials.app?.BaseUrl ?? process.env.TIKTOK_BASE_URL;
        const client = new TikTokShopNodeApiClient({
            config: {
                basePath: baseUrl,
                app_key: credentials.app.appKey,
                app_secret: credentials.app.appSecret,
            },
        });

        return new TikTokOrderSync(client, credentials, shopCipher);
    }

    // Generic API request wrapper with retry + 401 detection
    private async apiCallWithRetry<T>(fn: () => Promise<T>, context: string): Promise<T> {
        for (let attempt = 0; attempt <= this.MAX_RETRIES; attempt++) {
            try {
                return await fn();
            } catch (err: any) {
                    const status = err?.statusCode || err?.response?.statusCode;
                    const finalAttempt = attempt === this.MAX_RETRIES;

                    console.error(`[TikTok API] ${context} failed (attempt ${attempt + 1}/${this.MAX_RETRIES + 1})`, {
                        status,
                        message: err?.message
                    });

                    // Authentication failure - abort immediately and surface
                    if (status === 401) {
                        throw Object.assign(new Error('UNAUTHORIZED_TIKTOK_API'), {
                            code: 'UNAUTHORIZED_TIKTOK_API',
                            original: err
                        });
                    }

                    if (finalAttempt) throw err;

                    // Backoff
                    await new Promise(r => setTimeout(r, this.RETRY_BASE_DELAY_MS * (attempt + 1)));
            }
        }
        // Should never reach here
        throw new Error(`Failed to execute ${context}`);
    }

    async syncOrders(options: OrderSyncOptions): Promise<OrderSyncResult> {
        const startTime = Date.now();
        let syncResults: OrderSyncResult = {
            success: false,
            shopId: options.shop_id,
            shopName: this.credentials.shopName,
            totalOrdersProcessed: 0,
            ordersCreated: 0,
            ordersUpdated: 0,
            ordersWithPriceDetails: 0,
            errors: [],
            executionTimeMs: 0
        };

        let authFailed = false;
        try {
            // Validate input
            if (!options.sync_all && (!options.order_ids || options.order_ids.length === 0)) {
                throw new Error("Either provide order_ids or set sync_all=true with time filters");
            }

            let allOrders: any[] = [];

            if (options.sync_all) {
                // Sync orders within time range
                allOrders = await this.fetchOrdersInTimeRange(
                    options.create_time_ge,
                    options.create_time_lt,
                    options.update_time_ge,
                    options.update_time_lt,
                    options.page_size || 50
                );
            } else {
                // Sync specific order IDs
                allOrders = await this.fetchSpecificOrders(options.order_ids!);
            }

            console.log(`Fetched ${allOrders.length} orders for shop ${options.shop_id}`);

            // Process orders in batches
            const batchResults = await this.processOrderBatch(
                allOrders,
                this.credentials.id,
                options.include_price_detail || false,
                options.timeout_seconds || 120
            );

            syncResults.totalOrdersProcessed = batchResults.totalProcessed;
            syncResults.ordersCreated = batchResults.created;
            syncResults.ordersUpdated = batchResults.updated;
            syncResults.ordersWithPriceDetails = batchResults.withPriceDetails;
            syncResults.errors = batchResults.errors;
            syncResults.success = true;

            // Create notification for sync completion
            if (options.create_notifications !== false && syncResults.totalOrdersProcessed > 0) {
                await NotificationService.createNotification({
                    type: NotificationType.SYSTEM_ALERT,
                    title: '📊 Order Sync Completed',
                    message: `Successfully synced ${syncResults.totalOrdersProcessed} orders (${syncResults.ordersCreated} new, ${syncResults.ordersUpdated} updated) for shop ${this.credentials.shopName || options.shop_id}`,
                    userId: this.credentials.id,
                    shopId: this.credentials.id,
                    data: {
                        syncType: options.sync_all ? 'time_range' : 'specific_orders',
                        results: syncResults,
                        apiVersion: 'utility_function'
                    }
                });
            }

        } catch (error: any) {
            if (error?.code === 'UNAUTHORIZED_TIKTOK_API') {
                authFailed = true;
                console.error('TikTok API unauthorized: access token likely expired');
            } else {
                console.error("Error syncing orders:", error);
            }
            syncResults.error = error instanceof Error ? error.message : String(error);

            // Create error notification
            if (options.create_notifications !== false) {
                try {
                    await NotificationService.createNotification({
                        type: NotificationType.WEBHOOK_ERROR,
                        title: '❌ Order Sync Failed',
                        message: `Failed to sync orders for shop ${options.shop_id}: ${syncResults.error}`,
                        userId: this.credentials.id,
                        shopId: this.credentials.id,
                        data: {
                            syncType: 'order_sync_utility',
                            error: syncResults.error,
                            timestamp: Date.now()
                        }
                    });
                } catch (notificationError) {
                    console.error('Failed to create error notification:', notificationError);
                }
            }
            // Additional auth failure notification
            if (authFailed && options.create_notifications !== false) {
                try {
                    await NotificationService.createNotification({
                        type: NotificationType.WEBHOOK_ERROR,
                        title: 'TikTok Reauthorization Needed',
                        message: `Shop ${this.credentials.shopName || options.shop_id} TikTok authorization expired. Please re-connect the shop.`,
                        userId: this.credentials.id,
                        shopId: this.credentials.id,
                        data: {
                            authExpired: true,
                            shopId: options.shop_id,
                            hint: 'Trigger OAuth refresh / reauthorize'
                        }
                    });
                } catch (nErr) {
                    console.error('Failed to create auth failure notification', nErr);
                }
            }
        } finally {
            syncResults.executionTimeMs = Date.now() - startTime;
        }

        return syncResults;
    }

    private async fetchOrdersInTimeRange(
        createTimeGe?: number,
        createTimeLt?: number,
        updateTimeGe?: number,
        updateTimeLt?: number,
        pageSize = 50
    ): Promise<any[]> {
        let allOrders: any[] = [];
        let nextPageToken = "";
        try {
            // Build request body for order search
            const requestBody = new Order202309GetOrderListRequestBody();
            if (createTimeGe) requestBody.createTimeGe = createTimeGe;
            if (createTimeLt) requestBody.createTimeLt = createTimeLt;
            if (updateTimeGe) requestBody.updateTimeGe = updateTimeGe;
            if (updateTimeLt) requestBody.updateTimeLt = updateTimeLt;

            // Get first page using 202309 API (search functionality)
            const firstPage = await this.apiCallWithRetry(
                () => this.client.api.OrderV202309Api.OrdersSearchPost(
                    pageSize,
                    this.credentials.accessToken,
                    "application/json",
                    "DESC",
                    nextPageToken,
                    "update_time",
                    this.shopCipher,
                    requestBody
                ),
                'OrdersSearchPost:firstPage'
            );

            if (firstPage?.body?.data?.orders) {
                allOrders.push(...firstPage.body.data.orders);
                nextPageToken = firstPage.body.data.nextPageToken ?? "";
            }

            // Continue fetching all pages
            while (nextPageToken) {
                const tokenSnapshot = nextPageToken;
                const nextPageResult = await this.apiCallWithRetry(
                    () => this.client.api.OrderV202309Api.OrdersSearchPost(
                        pageSize,
                        this.credentials.accessToken,
                        "application/json",
                        "DESC",
                        tokenSnapshot,
                        "update_time",
                        this.shopCipher,
                        requestBody
                    ),
                    'OrdersSearchPost:pagination'
                );

                if (nextPageResult?.body?.data?.orders) {
                    allOrders.push(...nextPageResult.body.data.orders);
                }
                nextPageToken = nextPageResult.body?.data?.nextPageToken ?? "";
                await new Promise(r => setTimeout(r, 100));
            }
        } catch (error) {
            console.error('Error fetching orders in time range:', error);
            throw error;
        }
        return allOrders;
    }

    private async fetchSpecificOrders(orderIds: string[]): Promise<any[]> {
        const allOrders: any[] = [];
        const batchSize = 50;
        try {
            // Process order IDs in batches
            for (let i = 0; i < orderIds.length; i += batchSize) {
                const batch = orderIds.slice(i, i + batchSize);
                console.log(`Fetching batch ${Math.floor(i / batchSize) + 1}: ${batch.length} orders`);
                const result = await this.apiCallWithRetry(
                    () => this.client.api.OrderV202309Api.OrdersGet(
                        batch,
                        this.credentials.accessToken,
                        "application/json",
                        this.shopCipher
                    ),
                    'OrdersGet'
                );
                if (result?.body?.data?.orders) {
                    allOrders.push(...result.body.data.orders);
                }
                await new Promise(r => setTimeout(r, 100));
            }
        } catch (error) {
            console.error('Error fetching specific orders:', error);
            throw error;
        }
        return allOrders;
    }

    private async processOrderBatch(
        orders: any[],
        shopId: string,
        includePriceDetail: boolean,
        timeoutSeconds: number
    ): Promise<{
        totalProcessed: number;
        created: number;
        updated: number;
        withPriceDetails: number;
        errors: { orderId: string; error: string }[];
    }> {
        const BATCH_SIZE = 50;
        let results = {
            totalProcessed: 0,
            created: 0,
            updated: 0,
            withPriceDetails: 0,
            errors: [] as { orderId: string; error: string }[]
        };

        console.log(`Processing ${orders.length} orders in batches of ${BATCH_SIZE}`);

        for (let i = 0; i < orders.length; i += BATCH_SIZE) {
            const batch = orders.slice(i, i + BATCH_SIZE);
            const batchResult = await this.processSingleBatch(batch, shopId, includePriceDetail, timeoutSeconds);

            results.totalProcessed += batchResult.processed;
            results.created += batchResult.created;
            results.updated += batchResult.updated;
            results.withPriceDetails += batchResult.withPriceDetails;
            results.errors.push(...batchResult.errors);

            console.log(`Processed batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(orders.length / BATCH_SIZE)}`);
        }

        return results;
    }

    private async processSingleBatch(
        orders: any[],
        shopId: string,
        includePriceDetail: boolean,
        timeoutSeconds: number
    ) {
        let processed = 0;
        let created = 0;
        let updated = 0;
        let withPriceDetails = 0;
        let errors: { orderId: string; error: string }[] = [];

        try {
            // Remove transaction wrapper - process directly
            const orderIds = orders.map(o => o.id);
            const existingOrders = await prisma.order.findMany({
                where: { orderId: { in: orderIds } },
                select: { id: true, orderId: true }
            });

            const existingOrderMap = new Map(existingOrders.map(o => [o.orderId, o.id]));

            for (const order of orders) {
                try {
                    processed++;

                    // Fetch price details for each order
                    let priceDetails = null;
                    if (includePriceDetail) {
                        try {
                            const priceResult = await this.apiCallWithRetry(
                                () => this.client.api.OrderV202407Api.OrdersOrderIdPriceDetailGet(
                                    order.id,
                                    this.credentials.accessToken,
                                    "application/json",
                                    this.shopCipher
                                ),
                                'OrdersOrderIdPriceDetailGet'
                            );
                            if (priceResult?.body?.data) {
                                priceDetails = priceResult.body.data;
                                withPriceDetails++;
                            }
                            await new Promise(r => setTimeout(r, 50));
                        } catch (priceError: any) {
                            if (priceError?.code === 'UNAUTHORIZED_TIKTOK_API') throw priceError;
                            console.warn(`Price details fetch failed for ${order.id}`, priceError?.message);
                        }
                    }

                    // Enhanced channel data with price details
                    const channelData = {
                        // Standard TikTok order data
                        orderType: order.orderType,
                        fulfillmentType: order.fulfillmentType,
                        deliveryType: order.deliveryType,
                        paymentMethodName: order.paymentMethodName,
                        shippingProvider: order.shippingProvider,
                        deliveryOptionName: order.deliveryOptionName,
                        collectionTime: order.collectionTime,
                        userId: order.userId,
                        isOnHoldOrder: order.isOnHoldOrder,
                        splitOrCombineTag: order.splitOrCombineTag,
                        trackingNumber: order.trackingNumber,
                        warehouseId: order.warehouseId,
                        sellerNote: order.sellerNote,
                        // Additional fields
                        cancelOrderSlaTime: order.cancelOrderSlaTime,
                        ttsSlaTime: order.ttsSlaTime,
                        rtsSlaTime: order.rtsSlaTime,
                        rtsTime: order.rtsTime,
                        // Enhanced price details
                        ...(priceDetails && {
                            priceDetails,
                            priceDetailsFetchedAt: Date.now(),
                            detailedBreakdown: this.extractPriceBreakdown(priceDetails)
                        })
                    };

                    const orderData = {
                        orderId: order.id,
                        channel: Channel.TIKTOK,
                        buyerEmail: order.buyerEmail || "",
                        buyerMessage: order.buyerMessage || "",
                        createTime: order.createTime || Math.floor(Date.now() / 1000),
                        updateTime: order.updateTime || Math.floor(Date.now() / 1000),
                        status: order.status || "UNKNOWN",
                        totalAmount: order.payment?.totalAmount || null,
                        currency: order.payment?.currency || null,
                        paidTime: order.paidTime,
                        deliveryTime: order.deliveryTime,
                        channelData: JSON.stringify(channelData),
                        shopId: shopId,
                    };

                    if (existingOrderMap.has(order.id)) {
                        // Update existing order with price details
                        await prisma.order.update({
                            where: { id: existingOrderMap.get(order.id) },
                            data: {
                                status: orderData.status,
                                updateTime: orderData.updateTime,
                                deliveryTime: orderData.deliveryTime,
                                paidTime: orderData.paidTime,
                                totalAmount: orderData.totalAmount,
                                currency: orderData.currency,
                                buyerMessage: orderData.buyerMessage,
                                channelData: orderData.channelData,
                            }
                        });

                        // Update payment information with price details if it exists
                        if (priceDetails) {
                            await this.updateExistingPaymentWithPriceDetails(existingOrderMap.get(order.id)!, priceDetails);
                        }

                        // Upsert recipient address if it exists
                        if (order.recipientAddress) {
                            await this.upsertRecipientAddress(existingOrderMap.get(order.id)!, order.recipientAddress);
                        }
                        if(order.packages && order.packages.length > 0){
                            await prisma.orderPackage.deleteMany({
                                where: {
                                    orderId: existingOrderMap.get(order.id)!,
                                }
                            });
                            for(const pkg of order.packages){
                                await this.upsertOrderPackage(existingOrderMap.get(order.id)!, pkg);
                            }
                        }

                        // Sync order attributes
                        await syncOrderCanSplitOrNot(prisma, {
                            shop_id: shopId,
                            order_ids: [order.id]
                        });

                        updated++;
                    } else {
                        // Create new order with all associations including price details
                        await this.insertOrderWithAssociations(order, shopId, priceDetails);
                        created++;
                    }

                } catch (orderError: any) {
                    if (orderError?.code === 'UNAUTHORIZED_TIKTOK_API') {
                        console.error('Aborting batch due to auth failure');
                        errors.push({ orderId: 'AUTH', error: 'Authorization failed (401)' });
                        break;
                    }
                    console.error(`Error processing order ${order.id}:`, orderError);
                    errors.push({
                        orderId: order.id,
                        error: orderError instanceof Error ? orderError.message : String(orderError)
                    });
                }
            }

        } catch (error) {
            console.error('Error processing order batch:', error);
            throw error;
        }

        return { processed, created, updated, withPriceDetails, errors };
    }

    public extractPriceBreakdown(priceDetails: any) {
        // Extract key pricing information from TikTok price details
        const breakdown = {
            productPrice: 0,
            shippingFee: 0,
            taxes: 0,
            platformFees: 0,
            sellerDiscounts: 0,
            platformDiscounts: 0,
            vouchers: 0,
            finalAmount: 0,
            currency: priceDetails.currency || 'USD'
        };

        if (priceDetails.price_details) {
            for (const detail of priceDetails.price_details) {
                switch (detail.type?.toLowerCase()) {
                    case 'product_price':
                    case 'item_price':
                        breakdown.productPrice += parseFloat(detail.amount || '0');
                        break;
                    case 'shipping_fee':
                    case 'delivery_fee':
                        breakdown.shippingFee += parseFloat(detail.amount || '0');
                        break;
                    case 'tax':
                    case 'vat':
                        breakdown.taxes += parseFloat(detail.amount || '0');
                        break;
                    case 'platform_fee':
                    case 'service_fee':
                        breakdown.platformFees += parseFloat(detail.amount || '0');
                        break;
                    case 'seller_discount':
                        breakdown.sellerDiscounts += parseFloat(detail.amount || '0');
                        break;
                    case 'platform_discount':
                        breakdown.platformDiscounts += parseFloat(detail.amount || '0');
                        break;
                    case 'voucher':
                    case 'coupon':
                        breakdown.vouchers += parseFloat(detail.amount || '0');
                        break;
                }
            }
        }

        // Calculate final amount
        breakdown.finalAmount = breakdown.productPrice + breakdown.shippingFee + breakdown.taxes + breakdown.platformFees
            - breakdown.sellerDiscounts - breakdown.platformDiscounts - breakdown.vouchers;

        return breakdown;
    }

    public async updateExistingPaymentWithPriceDetails(orderId: string, priceDetails: any) {
        try {
            const existingPayment = await prisma.orderPayment.findUnique({
                where: { orderId: orderId }
            });

            if (existingPayment) {
                // Parse existing channel data
                let paymentChannelData = {};
                try {
                    paymentChannelData = JSON.parse(existingPayment.channelData || '{}');
                } catch (error) {
                    console.warn('Failed to parse existing payment channelData');
                }

                // Enhanced payment channel data with detailed pricing
                const enhancedChannelData = {
                    ...paymentChannelData,
                    // Add detailed pricing information
                    detailedPricing: priceDetails,
                    priceBreakdown: priceDetails.price_details || [],
                    priceDetailsFetchedAt: Date.now(),
                    // Extract key pricing metrics
                    pricingBreakdown: this.extractPriceBreakdown(priceDetails)
                };

                await prisma.orderPayment.update({
                    where: { id: existingPayment.id },
                    data: {
                        channelData: JSON.stringify(enhancedChannelData)
                    }
                });

                console.log(`Updated payment with price details for order ${orderId}`);
            }
        } catch (error) {
            console.warn(`Failed to update payment with price details for order ${orderId}:`, error);
        }
    }

    public async upsertRecipientAddress(orderId: string, recipientAddress: any) {
        try {
            const addressChannelData = {
                addressDetail: recipientAddress.addressDetail,
                addressLine1: recipientAddress.addressLine1,
                addressLine2: recipientAddress.addressLine2 || "",
                addressLine3: recipientAddress.addressLine3 || "",
                addressLine4: recipientAddress.addressLine4 || "",
                firstName: recipientAddress.firstName || "",
                firstNameLocalScript: recipientAddress.firstNameLocalScript || "",
                lastName: recipientAddress.lastName || "",
                lastNameLocalScript: recipientAddress.lastNameLocalScript || "",
                regionCode: recipientAddress.regionCode,
                districtInfo: recipientAddress.districtInfo || []
            };

            await prisma.orderRecipientAddress.upsert({
                where: { orderId: orderId },
                update: {
                    fullAddress: recipientAddress.fullAddress,
                    name: recipientAddress.name,
                    phoneNumber: recipientAddress.phoneNumber,
                    postalCode: recipientAddress.postalCode || "",
                    channelData: JSON.stringify(addressChannelData)
                },
                create: {
                    orderId: orderId,
                    fullAddress: recipientAddress.fullAddress,
                    name: recipientAddress.name,
                    phoneNumber: recipientAddress.phoneNumber,
                    postalCode: recipientAddress.postalCode || "",
                    channelData: JSON.stringify(addressChannelData)
                }
            });

            console.log(`Upserted recipient address for order ${orderId}`);
        } catch (error) {
            console.warn(`Failed to upsert recipient address for order ${orderId}:`, error);
        }
    }

    public async upsertOrderPackage(orderId: string, pkg: any) {
        try {
            // Wrap API call with retry
            const packageDetailResult = await this.apiCallWithRetry(
                () => this.client.api.FulfillmentV202309Api.PackagesPackageIdGet(
                    pkg.id,
                    this.credentials.accessToken,
                    "application/json",
                    this.shopCipher
                ),
                'PackagesPackageIdGet'
            );

            let packageData: any = {
                orderId: orderId,
                packageId: pkg.id
            };

            let packageChannelData: any = {
                originalPackageData: pkg,
                fetchedAt: Date.now()
            };

            if (packageDetailResult?.body?.data) {
                const packageDetail = packageDetailResult.body.data;
                
                // Map API response to model fields - only include non-undefined values
                const apiFields: any = {};
                
                // Core TikTok package fields
                if (packageDetail.packageStatus !== undefined) apiFields.status = packageDetail.packageStatus;
                if (packageDetail.trackingNumber !== undefined) apiFields.trackingNumber = packageDetail.trackingNumber;
                if (packageDetail.shippingProviderId !== undefined) apiFields.shippingProviderId = packageDetail.shippingProviderId;
                if (packageDetail.shippingProviderName !== undefined) apiFields.shippingProviderName = packageDetail.shippingProviderName;
                
                // API response data
                if (packageDetail.orderLineItemIds !== undefined) apiFields.orderLineItemIds = packageDetail.orderLineItemIds || [];
                if (packageDetail.orders !== undefined) apiFields.ordersData = JSON.stringify(packageDetail.orders);
                
                // Extended fields from new schema
                if (packageDetail.shippingType !== undefined) apiFields.shippingType = packageDetail.shippingType;
                if (packageDetail.createTime !== undefined) apiFields.createTime = packageDetail.createTime;
                if (packageDetail.updateTime !== undefined) apiFields.updateTime = packageDetail.updateTime;
                if (packageDetail.splitAndCombineTag !== undefined) apiFields.splitAndCombineTag = packageDetail.splitAndCombineTag;
                if (packageDetail.hasMultiSkus !== undefined) apiFields.hasMultiSkus = packageDetail.hasMultiSkus;
                if (packageDetail.noteTag !== undefined) apiFields.noteTag = packageDetail.noteTag;
                if (packageDetail.deliveryOptionName !== undefined) apiFields.deliveryOptionName = packageDetail.deliveryOptionName;
                if (packageDetail.deliveryOptionId !== undefined) apiFields.deliveryOptionId = packageDetail.deliveryOptionId;
                if (packageDetail.lastMileTrackingNumber !== undefined) apiFields.lastMileTrackingNumber = packageDetail.lastMileTrackingNumber;
                if ((packageDetail as any).pickupSlot?.startTime !== undefined) apiFields.pickupSlotStartTime = (packageDetail as any).pickupSlot.startTime;
                if ((packageDetail as any).pickupSlot?.endTime !== undefined) apiFields.pickupSlotEndTime = (packageDetail as any).pickupSlot.endTime;
                if (packageDetail.handoverMethod !== undefined) apiFields.handoverMethod = packageDetail.handoverMethod;
                
                packageData = {
                    ...packageData,
                    ...apiFields
                };

                packageChannelData = {
                    ...packageChannelData,
                    packageDetailApi: packageDetail,
                    apiVersion: '202309',
                    fetchSuccess: true
                };
            } else {
                packageChannelData = {
                    ...packageChannelData,
                    fetchSuccess: false,
                    fetchError: 'No data returned from API'
                };
            }

            packageData.channelData = JSON.stringify(packageChannelData);
            
            // Prepare data for upsert - separate update and create data
            const { orderId: _, packageId: __, ...updateData } = packageData;
            
            await prisma.orderPackage.upsert({
                where: { 
                    orderId_packageId: {
                        orderId: orderId,
                        packageId: pkg.id
                    }
                },
                update: updateData,
                create: packageData
            });

            console.log(`Upserted package ${pkg.id} for order ${orderId}`);

            // Add small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 100));
            
        } catch (packageError: any) {
            if (packageError?.code === 'UNAUTHORIZED_TIKTOK_API') {
                console.error(`Auth failed while fetching package ${pkg.id}, aborting upsert`);
                return;
            }
            console.warn(`Failed to upsert package ${pkg.id} for order ${orderId}:`, packageError);
            
            // Still try to upsert package with basic info if API call fails
            try {
                const fallbackData = {
                    orderId: orderId,
                    packageId: pkg.id,
                    channelData: JSON.stringify({
                        originalPackageData: pkg,
                        fetchError: packageError instanceof Error ? packageError.message : String(packageError),
                        fetchedAt: Date.now(),
                        fetchSuccess: false
                    })
                };
                
                const { orderId: _, packageId: __, ...updateFallbackData } = fallbackData;
                
                await prisma.orderPackage.upsert({
                    where: { 
                        orderId_packageId: {
                            orderId: orderId,
                            packageId: pkg.id
                        }
                    },
                    update: updateFallbackData,
                    create: fallbackData
                });
            } catch (fallbackError) {
                console.error(`Failed to upsert fallback package ${pkg.id}:`, fallbackError);
            }
        }
    }

    private async createOrderPayment(orderId: string, paymentData: any, priceDetails: any = null) {
        // Enhanced payment channel data with detailed pricing
        const paymentChannelData = {
            // Original TikTok payment fields
            originalTotalProductPrice: paymentData.originalTotalProductPrice,
            originalShippingFee: paymentData.originalShippingFee,
            shippingFee: paymentData.shippingFee,
            retailDeliveryFee: paymentData.retailDeliveryFee,
            buyerServiceFee: paymentData.buyerServiceFee,
            sellerDiscount: paymentData.sellerDiscount,
            platformDiscount: paymentData.platformDiscount,
            // Enhanced price details
            ...(priceDetails && {
                detailedPricing: priceDetails,
                priceBreakdown: priceDetails.price_details || [],
                pricingBreakdown: this.extractPriceBreakdown(priceDetails),
                priceDetailsFetchedAt: Date.now()
            })
        };

        await prisma.orderPayment.create({
            data: {
                orderId: orderId,
                currency: paymentData.currency || 'USD',
                totalAmount: paymentData.totalAmount?.toString() || '0',
                subTotal: paymentData.subTotal?.toString() || '0',
                tax: paymentData.tax?.toString() || '0',
                channelData: JSON.stringify(paymentChannelData)
            }
        });
    }

    // Insert a new order and its associations, including payment and price details
    private async insertOrderWithAssociations(
        order: any,
        shopId: string,
        priceDetails: any = null
    ) {
        // Enhanced channel data with price details
        const channelData = {
            orderType: order.orderType,
            fulfillmentType: order.fulfillmentType,
            deliveryType: order.deliveryType,
            paymentMethodName: order.paymentMethodName,
            shippingProvider: order.shippingProvider,
            deliveryOptionName: order.deliveryOptionName,
            collectionTime: order.collectionTime,
            userId: order.userId,
            isOnHoldOrder: order.isOnHoldOrder,
            splitOrCombineTag: order.splitOrCombineTag,
            trackingNumber: order.trackingNumber,
            warehouseId: order.warehouseId,
            sellerNote: order.sellerNote,
            cancelOrderSlaTime: order.cancelOrderSlaTime,
            ttsSlaTime: order.ttsSlaTime,
            rtsSlaTime: order.rtsSlaTime,
            rtsTime: order.rtsTime,
            ...(priceDetails && {
                priceDetails,
                priceDetailsFetchedAt: Date.now(),
                detailedBreakdown: this.extractPriceBreakdown(priceDetails)
            })
        };

        const existing = await prisma.order.findUnique({
            where: { orderId: order.id },
            select: { id: true }
        });

        const persistedOrder = await prisma.order.upsert({
            where: { orderId: order.id },
            create: {
                orderId: order.id,
                channel: Channel.TIKTOK,
                buyerEmail: order.buyerEmail || "",
                buyerMessage: order.buyerMessage || "",
                createTime: order.createTime || Math.floor(Date.now() / 1000),
                updateTime: order.updateTime || Math.floor(Date.now() / 1000),
                status: order.status || "UNKNOWN",
                totalAmount: order.payment?.totalAmount || null,
                currency: order.payment?.currency || null,
                paidTime: order.paidTime,
                deliveryTime: order.deliveryTime,
                channelData: JSON.stringify(channelData),
                shopId: shopId,
            },
            update: {
                status: order.status || "UNKNOWN",
                buyerEmail: order.buyerEmail || "",
                buyerMessage: order.buyerMessage || "",
                updateTime: order.updateTime || Math.floor(Date.now() / 1000),
                deliveryTime: order.deliveryTime,
                paidTime: order.paidTime,
                totalAmount: order.payment?.totalAmount || null,
                currency: order.payment?.currency || null,
                channelData: JSON.stringify(channelData),
            }
        });

        // If updating, clear old associations to reinsert fresh data (safe transactional cleanup)
        if (existing?.id) {
            try {
                console.log(`Cleaning previous associations for order ${order.id} (${persistedOrder.id})`);
                await prisma.$transaction([
                    prisma.orderLineItem.deleteMany({ where: { orderId: persistedOrder.id } }),
                    prisma.orderPayment.deleteMany({ where: { orderId: persistedOrder.id } }),
                    prisma.orderRecipientAddress.deleteMany({ where: { orderId: persistedOrder.id } }),
                    prisma.orderPackage.deleteMany({ where: { orderId: persistedOrder.id } }) // ensure old packages removed too
                ]);
            } catch (cleanupErr) {
                console.warn(`Transactional cleanup failed for order ${order.id}, attempting fallback:`, cleanupErr);
                // Fallback: sequential deletes (avoids parallel transaction conflicts)
                try {
                    await prisma.orderLineItem.deleteMany({ where: { orderId: persistedOrder.id } });
                    await prisma.orderPayment.deleteMany({ where: { orderId: persistedOrder.id } });
                    await prisma.orderRecipientAddress.deleteMany({ where: { orderId: persistedOrder.id } });
                    await prisma.orderPackage.deleteMany({ where: { orderId: persistedOrder.id } });
                } catch (fallbackErr) {
                    console.error(`Fallback cleanup failed for order ${order.id}:`, fallbackErr);
                }
            }
        }

        if (order.payment) {
            await this.createOrderPayment(persistedOrder.id, order.payment, priceDetails);
        }

        if (order.lineItems && Array.isArray(order.lineItems)) {
            for (const item of order.lineItems) {
                try {
                    const itemChannelData = {
                        skuType: item.skuType,
                        skuImage: item.skuImage,
                        sellerDiscount: item.sellerDiscount,
                        platformDiscount: item.platformDiscount,
                        displayStatus: item.displayStatus,
                        isGift: item.isGift || false,
                        packageId: item.packageId,
                        packageStatus: item.packageStatus,
                        shippingProviderId: item.shippingProviderId,
                        shippingProviderName: item.shippingProviderName,
                        trackingNumber: item.trackingNumber,
                        rtsTime: item.rtsTime
                    };

                    await prisma.orderLineItem.create({
                        data: {
                            orderId: persistedOrder.id,
                            lineItemId: item.id,
                            productId: item.productId,
                            productName: item.productName,
                            skuId: item.skuId,
                            skuName: item.skuName || "",
                            sellerSku: item.sellerSku || "",
                            currency: item.currency,
                            originalPrice: item.originalPrice,
                            salePrice: item.salePrice,
                            channelData: JSON.stringify(itemChannelData)
                        }
                    });
                } catch (itemError) {
                    console.warn(`Failed to create order item for order ${order.id}:`, itemError);
                }
            }
        }

        if (order.recipientAddress) {
            try {
                const addressChannelData = {
                    addressDetail: order.recipientAddress.addressDetail,
                    addressLine1: order.recipientAddress.addressLine1,
                    addressLine2: order.recipientAddress.addressLine2 || "",
                    addressLine3: order.recipientAddress.addressLine3 || "",
                    addressLine4: order.recipientAddress.addressLine4 || "",
                    firstName: order.recipientAddress.firstName || "",
                    firstNameLocalScript: order.recipientAddress.firstNameLocalScript || "",
                    lastName: order.recipientAddress.lastName || "",
                    lastNameLocalScript: order.recipientAddress.lastNameLocalScript || "",
                    regionCode: order.recipientAddress.regionCode,
                    districtInfo: order.recipientAddress.districtInfo || []
                };

                await prisma.orderRecipientAddress.create({
                    data: {
                        orderId: persistedOrder.id,
                        fullAddress: order.recipientAddress.fullAddress,
                        name: order.recipientAddress.name,
                        phoneNumber: order.recipientAddress.phoneNumber,
                        postalCode: order.recipientAddress.postalCode || "",
                        channelData: JSON.stringify(addressChannelData)
                    }
                });
            } catch (addrError) {
                console.warn(`Failed to create shipping address for order ${order.id}:`, addrError);
            }
        }

        // Create packages with detailed information
        if (order.packages && Array.isArray(order.packages)) {
            for (const pkg of order.packages) {
                try {
                    // Get package detail from TikTok API
                    console.log(`Fetching package detail for package ${pkg.id}`);
                    const packageDetailResult = await this.client.api.FulfillmentV202309Api.PackagesPackageIdGet(
                        pkg.id,
                        this.credentials.accessToken,
                        "application/json",
                        this.shopCipher
                    );

                    let packageData: any = {
                        orderId: persistedOrder.id,
                        packageId: pkg.id
                    };

                    let packageChannelData: any = {
                        originalPackageData: pkg,
                        fetchedAt: Date.now()
                    };

                    if (packageDetailResult?.body?.data) {
                        const packageDetail = packageDetailResult.body.data;
                        
                        // Map API response to model fields - only include non-undefined values
                        const apiFields: any = {};
                        
                        // Core TikTok package fields
                        if (packageDetail.packageStatus !== undefined) apiFields.status = packageDetail.packageStatus;
                        if (packageDetail.trackingNumber !== undefined) apiFields.trackingNumber = packageDetail.trackingNumber;
                        if (packageDetail.shippingProviderId !== undefined) apiFields.shippingProviderId = packageDetail.shippingProviderId;
                        if (packageDetail.shippingProviderName !== undefined) apiFields.shippingProviderName = packageDetail.shippingProviderName;
                        
                        // API response data
                        if (packageDetail.orderLineItemIds !== undefined) apiFields.orderLineItemIds = packageDetail.orderLineItemIds || [];
                        if (packageDetail.orders !== undefined) apiFields.ordersData = JSON.stringify(packageDetail.orders);
                        
                        // Extended fields from new schema
                        if (packageDetail.shippingType !== undefined) apiFields.shippingType = packageDetail.shippingType;
                        if (packageDetail.createTime !== undefined) apiFields.createTime = packageDetail.createTime;
                        if (packageDetail.updateTime !== undefined) apiFields.updateTime = packageDetail.updateTime;
                        if (packageDetail.splitAndCombineTag !== undefined) apiFields.splitAndCombineTag = packageDetail.splitAndCombineTag;
                        if (packageDetail.hasMultiSkus !== undefined) apiFields.hasMultiSkus = packageDetail.hasMultiSkus;
                        if (packageDetail.noteTag !== undefined) apiFields.noteTag = packageDetail.noteTag;
                        if (packageDetail.deliveryOptionName !== undefined) apiFields.deliveryOptionName = packageDetail.deliveryOptionName;
                        if (packageDetail.deliveryOptionId !== undefined) apiFields.deliveryOptionId = packageDetail.deliveryOptionId;
                        if (packageDetail.lastMileTrackingNumber !== undefined) apiFields.lastMileTrackingNumber = packageDetail.lastMileTrackingNumber;
                        if ((packageDetail as any).pickupSlot?.startTime !== undefined) apiFields.pickupSlotStartTime = (packageDetail as any).pickupSlot.startTime;
                        if ((packageDetail as any).pickupSlot?.endTime !== undefined) apiFields.pickupSlotEndTime = (packageDetail as any).pickupSlot.endTime;
                        if (packageDetail.handoverMethod !== undefined) apiFields.handoverMethod = packageDetail.handoverMethod;
                        
                        packageData = {
                            ...packageData,
                            ...apiFields
                        };

                        packageChannelData = {
                            ...packageChannelData,
                            packageDetailApi: packageDetail,
                            apiVersion: '202309',
                            fetchSuccess: true
                        };
                    } else {
                        packageChannelData = {
                            ...packageChannelData,
                            fetchSuccess: false,
                            fetchError: 'No data returned from API'
                        };
                    }

                    packageData.channelData = JSON.stringify(packageChannelData);
                    
                    await prisma.orderPackage.create({
                        data: packageData
                    });

                    console.log(`Created package ${pkg.id} for order ${order.id}`);

                    // Add small delay to avoid rate limiting
                    await new Promise(resolve => setTimeout(resolve, 100));
                    
                } catch (packageError) {
                    console.warn(`Failed to create package ${pkg.id} for order ${order.id}:`, packageError);
                    
                    // Still create package with basic info if API call fails
                    try {
                        await prisma.orderPackage.create({
                            data: {
                                orderId: persistedOrder.id,
                                packageId: pkg.id,
                                channelData: JSON.stringify({
                                    originalPackageData: pkg,
                                    fetchError: packageError instanceof Error ? packageError.message : String(packageError),
                                    fetchedAt: Date.now(),
                                    fetchSuccess: false
                                })
                            }
                        });
                    } catch (fallbackError) {
                        console.error(`Failed to create fallback package ${pkg.id}:`, fallbackError);
                    }
                }
            }
        }
    }
}

// Enhanced convenience function for syncing orders with price details
export async function syncOrdersWithPriceDetails(
    shop_id: string,
    order_ids: string[],
    options: Partial<OrderSyncOptions> = {}
): Promise<OrderSyncResult> {
    const sync = await TikTokOrderSync.create(shop_id);
    return sync.syncOrders({
        shop_id,
        order_ids,
        sync_all: false,
        include_price_detail: true, // Always include price details
        create_notifications: true,
        timeout_seconds: 300, // Longer timeout for price detail fetching
        ...options
    });
}

export async function syncRecentOrdersWithPriceDetails(
    shop_id: string,
    hours_back: number = 24,
    options: Partial<OrderSyncOptions> = {}
): Promise<OrderSyncResult> {
    const now = Math.floor(Date.now() / 1000);
    const hoursBackSeconds = hours_back * 60 * 60;
    const update_time_ge = now - hoursBackSeconds;

    const sync = await TikTokOrderSync.create(shop_id);
    return sync.syncOrders({
        shop_id,
        sync_all: true,
        update_time_ge,
        update_time_lt: now,
        include_price_detail: true, // Always include price details
        create_notifications: true,
        page_size: 20, // Smaller page size when fetching price details
        timeout_seconds: 600, // Longer timeout for price detail fetching
        ...options
    });
}

// Utility function to refresh price details for existing orders
export async function refreshPriceDetailsForOrders(
    shop_id: string,
    order_ids: string[]
): Promise<{
    success: boolean;
    processedCount: number;
    successCount: number;
    errors: { orderId: string; error: string }[];
}> {
    const sync = await TikTokOrderSync.create(shop_id);
    const results = {
        success: true,
        processedCount: 0,
        successCount: 0,
        errors: [] as { orderId: string; error: string }[]
    };

    try {
        for (const orderId of order_ids) {
            results.processedCount++;

            try {
                console.log(`Refreshing price details for order ${orderId}`);

                // Fetch price details
                const priceResult = await sync.client.api.OrderV202407Api.OrdersOrderIdPriceDetailGet(
                    orderId,
                    sync.credentials.accessToken,
                    "application/json",
                    sync.shopCipher
                );

                if (priceResult?.body?.data) {
                    // Find existing order
                    const existingOrder = await prisma.order.findFirst({
                        where: {
                            orderId: orderId,
                            shopId: sync.credentials.id
                        }
                    });

                    if (existingOrder) {
                        // Update order channel data with price details
                        let channelData = {};
                        try {
                            channelData = JSON.parse(existingOrder.channelData || '{}');
                        } catch (error) {
                            console.warn('Failed to parse existing channelData');
                        }

                        const updatedChannelData = {
                            ...channelData,
                            priceDetails: priceResult.body.data,
                            priceDetailsFetchedAt: Date.now(),
                            detailedBreakdown: sync.extractPriceBreakdown(priceResult.body.data)
                        };

                        await prisma.order.update({
                            where: { id: existingOrder.id },
                            data: {
                                channelData: JSON.stringify(updatedChannelData)
                            }
                        });

                        // Also update payment record if exists without transaction
                        await sync.updateExistingPaymentWithPriceDetails(
                            existingOrder.id,
                            priceResult.body.data
                        );

                        results.successCount++;
                        console.log(`Successfully refreshed price details for order ${orderId}`);
                    } else {
                        results.errors.push({
                            orderId: orderId,
                            error: 'Order not found in database'
                        });
                    }
                } else {
                    results.errors.push({
                        orderId: orderId,
                        error: 'No price data returned from API'
                    });
                }

                // Rate limiting delay
                await new Promise(resolve => setTimeout(resolve, 100));

            } catch (error) {
                console.error(`Failed to refresh price details for order ${orderId}:`, error);
                results.errors.push({
                    orderId: orderId,
                    error: error instanceof Error ? error.message : String(error)
                });
            }
        }

        results.success = results.errors.length === 0;

    } catch (error) {
        console.error('Error refreshing price details:', error);
        results.success = false;
        results.errors.push({
            orderId: 'bulk_operation',
            error: error instanceof Error ? error.message : String(error)
        });
    }

    return results;
}

// Utility function to sync a single order by ID
export async function syncOrderById(
    shop_id: string,
    order_id: string,
    options: Partial<OrderSyncOptions> = {}
): Promise<OrderSyncResult> {
    const sync = await TikTokOrderSync.create(shop_id);
    return sync.syncOrders({
        shop_id,
        order_ids: [order_id],
        sync_all: false,
        include_price_detail: true, // Always include price details for single order sync
        create_notifications: options.create_notifications ?? true,
        timeout_seconds: options.timeout_seconds ?? 300,
        ...options
    });
}

export async function syncPackageById(
    shop_id: string,
    order_id: string,
    pkg: { id: string }
): Promise<void> {
    const sync = await TikTokOrderSync.create(shop_id);
    await sync.upsertOrderPackage(order_id, pkg);
}