import { PrismaClient } from "@prisma/client";
import {
    Order202309GetOrderListRequestBody,
    TikTokShopNodeApiClient,
} from "@/nodejs_sdk";
import { SchedulerService } from "./scheduler/scheduler-service";

const prisma = new PrismaClient();

export async function sync_all_shop_orders(page_size: number = 50, day_to_sync: number = 1) {
    try {
        const allShops = await prisma.shopAuthorization.findMany({
            where: { status: 'ACTIVE', app: { channel: 'TIKTOK' } }
        });

        if (!allShops) {
            throw new Error('No active TikTok shops found');
        }

        // Schedule individual shop sync jobs with 2-minute delays
        for (let i = 0; i < allShops.length; i++) {
            const shop = allShops[i];
            const delayMinutes = i * 2; // 2 minutes delay per shop

            await scheduleShopSyncJob(shop, delayMinutes, page_size, day_to_sync);
        }

        return allShops.length;
    } catch (err: any) {
        console.error("Error getting orders:", err);
    } finally {
        await prisma.$disconnect();
    }
}

async function scheduleShopSyncJob(shop: any, delayMinutes: number, page_size: number, day_to_sync: number) {
    try {
        const scheduledAt = new Date(Date.now() + delayMinutes * 60 * 1000);

        // Create a scheduler job for individual shop sync
        const job = await prisma.schedulerJob.create({
            data: {
                name: `Sync Shop Orders - ${shop.shopName || shop.shopId}`,
                description: `Automated sync of orders for shop ${shop.shopName || shop.shopId}`,
                type: 'FUNCTION_CALL',
                triggerType: 'ONE_TIME',
                config: JSON.stringify({
                    functionName: "syncSingleShopOrders",
                    params: {
                        shopId: shop.id,
                        page_size: page_size,
                        day_to_sync: day_to_sync
                    }
                }),
                timeout: 600000, // 10 minutes
                retryCount: 2,
                retryDelay: 120000, // 2 minutes
                nextExecutionAt: scheduledAt,
                tags: ['shop-sync', 'auto-generated'],
                status: 'ACTIVE'
            }
        });

        SchedulerService.getInstance().scheduleJob(job);

        console.log(`Scheduled shop sync job for ${shop.shopName || shop.shopId} at ${scheduledAt.toISOString()}`);
    } catch (error) {
        console.error(`Error scheduling job for shop ${shop.shopId}:`, error);
    }
}

export async function processShop(shop_id: string, day_to_sync: number, page_size: number) {
    // Tạo body request
    const body = new Order202309GetOrderListRequestBody();

    body.createTimeGe = Math.floor(Date.now() / 1000) - day_to_sync * 24 * 60 * 60; // 7 days ago
    body.createTimeLt = Math.floor(Date.now() / 1000); // now

    const shop = await prisma.shopAuthorization.findUnique({
        where: { id: shop_id },
        include: { app: true }
    });

    if (!shop) {
        console.error(`Shop with ID ${shop_id} not found`);
        return;
    }
    const app_key = shop?.app?.appKey;
    const app_secret = shop?.app?.appSecret;
    const baseUrl = shop?.app?.BaseUrl ?? process.env.TIKTOK_BASE_URL;
    // Khởi tạo client
    const client = new TikTokShopNodeApiClient({
        config: {
            basePath: baseUrl,
            app_key: app_key,
            app_secret: app_secret,
        },
    });

    const sort_direction = "ASC";
    const sort_by = "create_time";

    // Gọi API
    const result = await client.api.OrderV202309Api.OrdersSearchPost(
        page_size,
        shop.accessToken,
        "application/json",
        sort_direction,
        "",
        sort_by,
        shop.shopCipher ?? undefined, // Use extracted shopCipher, ensure not null
        body
    );

    if (result.body?.data?.orders) {
        let allOrders = [...result.body.data.orders];
        let nextPageToken = result.body.data.nextPageToken;

        // Continue fetching all pages if there are more
        while (nextPageToken) {
            try {
                console.log(`Fetching next page with token: ${nextPageToken}`);

                const nextPageResult = await client.api.OrderV202309Api.OrdersSearchPost(
                    page_size,
                    shop.accessToken,
                    "application/json",
                    sort_direction,
                    nextPageToken, // Use the token for next page
                    sort_by,
                    shop.shopCipher ?? undefined, // Use extracted shopCipher, ensure not null
                    body
                );

                if (nextPageResult.body?.data?.orders) {
                    allOrders.push(...nextPageResult.body.data.orders);
                    console.log(`Fetched ${nextPageResult.body.data.orders.length} more orders. Total: ${allOrders.length}`);
                }

                // Update token for next iteration
                nextPageToken = nextPageResult.body?.data?.nextPageToken;

                // Add a small delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 100));

            } catch (paginationError) {
                console.error('Error fetching next page:', paginationError);
                break; // Stop pagination on error but continue with orders we have
            }
        }

        console.log(`Total orders to sync: ${allOrders.length}`);
        await syncOrdersToDatabase(allOrders, shop.id); // Use shop.id (ObjectId) instead of credentials.id

    }
}

async function syncOrdersToDatabase(orders: any[], shopId: string) {
    const BATCH_SIZE = 50;
    console.log(`Starting sync of ${orders.length} orders in batches of ${BATCH_SIZE}`);

    // Process orders in batches
    for (let i = 0; i < orders.length; i += BATCH_SIZE) {
        const batch = orders.slice(i, i + BATCH_SIZE);
        await processBatch(batch, shopId);
        console.log(`Processed ${Math.min(i + BATCH_SIZE, orders.length)} of ${orders.length} orders`);
    }

    console.log('Sync completed');
}

async function processBatch(orders: any[], shopId: string) {
    try {
        // Collect existing order IDs to determine which are new vs updates
        const orderIds = orders.map(o => o.id);
        const existingOrders = await prisma.order.findMany({
            where: { orderId: { in: orderIds } },
            select: { id: true, orderId: true }
        });

        const existingOrderMap = new Map(existingOrders.map(o => [o.orderId, o.id]));
        const newOrders = [];
        const updateOrders = [];

        // Separate new orders from updates
        for (const order of orders) {
            const createTime = order.createTime || Math.floor(Date.now() / 1000);

            // Prepare TikTok-specific data for channelData
            const channelData = {
                cancelOrderSlaTime: order.cancelOrderSlaTime,
                collectionTime: order.collectionTime,
                commercePlatform: order.commercePlatform,
                deliveryOptionId: order.deliveryOptionId,
                deliveryOptionName: order.deliveryOptionName,
                deliveryType: order.deliveryType,
                fulfillmentType: order.fulfillmentType,
                hasUpdatedRecipientAddress: order.hasUpdatedRecipientAddress || false,
                isCod: order.isCod || false,
                isOnHoldOrder: order.isOnHoldOrder || false,
                isReplacementOrder: order.isReplacementOrder || false,
                isSampleOrder: order.isSampleOrder || false,
                orderType: order.orderType,
                paymentMethodName: order.paymentMethodName,
                shippingProvider: order.shippingProvider,
                shippingProviderId: order.shippingProviderId,
                shippingType: order.shippingType,
                trackingNumber: order.trackingNumber,
                rtsSlaTime: order.rtsSlaTime,
                rtsTime: order.rtsTime,
                ttsSlaTime: order.ttsSlaTime,
                userId: order.userId,
                warehouseId: order.warehouseId
            };

            const orderData = {
                orderId: order.id,
                channel: 'TIKTOK' as any, // Add channel field and cast to 'any' or 'Channel'
                buyerEmail: order.buyerEmail || "",
                buyerMessage: order.buyerMessage || "",
                createTime: createTime,
                updateTime: order.updateTime,
                status: order.status || "UNKNOWN",
                totalAmount: order.payment?.totalAmount || null,
                currency: order.payment?.currency || null,
                paidTime: order.paidTime,
                deliveryTime: order.deliveryTime,
                channelData: JSON.stringify(channelData), // Store TikTok-specific fields
                ttsSlaTime: order.ttsSlaTime || null,
                rtsSlaTime: order.rtsSlaTime || null,
                cancelOrderSlaTime: order.cancelOrderSlaTime || null,
                deliverySlaTime: order.deliverySlaTime || null,
                deliveryDueTime: order.deliveryDueTime || null,
                collectionDueTime: order.collectionDueTime || null,
                shippingDueTime: order.shippingDueTime || null,
                fastDispatchSlaTime: order.fastDispatchSlaTime || null,
                pickUpCutOffTime: order.pickUpCutOffTime || null,
                deliveryOptionRequiredDeliveryTime: order.deliveryOptionRequiredDeliveryTime || null
            };

            if (existingOrderMap.has(order.id)) {
                updateOrders.push({
                    ...orderData,
                    dbId: existingOrderMap.get(order.id)
                });
            } else {
                newOrders.push({...orderData, shopId });
            }
        }

        // Batch create new orders
        if (newOrders.length > 0) {
            await prisma.order.createMany({
                data: newOrders
            });
        }

        // Batch update existing orders
        if (updateOrders.length > 0) {
            const updatePromises = updateOrders.map(order =>
                prisma.order.update({
                    where: { id: order.dbId },
                    data: {
                        status: order.status,
                        updateTime: order.updateTime,
                        deliveryTime: order.deliveryTime,
                        paidTime: order.paidTime,
                        totalAmount: order.totalAmount,
                        currency: order.currency,
                        buyerMessage: order.buyerMessage,
                        channelData: order.channelData,
                    }
                })
            );
            await Promise.all(updatePromises);
        }

        // Get all order IDs after insert/update
        const allOrders = await prisma.order.findMany({
            where: { orderId: { in: orderIds } },
            select: { id: true, orderId: true }
        });
        const orderIdMap = new Map(allOrders.map(o => [o.orderId, o.id]));

        // Process line items, payments, addresses, and packages using unified models
        const allLineItems = [];
        const allPayments = [];
        const allAddresses = [];
        const allPackages = [];

        for (const order of orders) {
            const dbOrderId = orderIdMap.get(order.id);
            if (!dbOrderId) continue;

            // Collect line items for unified OrderLineItem model
            if (order.lineItems) {
                for (const item of order.lineItems) {
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

                    allLineItems.push({
                        lineItemId: item.id,
                        productId: item.productId,
                        productName: item.productName,
                        skuId: item.skuId,
                        skuName: item.skuName || "",
                        sellerSku: item.sellerSku || "",
                        currency: item.currency,
                        originalPrice: item.originalPrice,
                        salePrice: item.salePrice,
                        channelData: JSON.stringify(itemChannelData),
                        orderId: dbOrderId,
                    });
                }
            }

            // Collect payments for unified OrderPayment model
            if (order.payment) {
                const paymentChannelData = {
                    originalTotalProductPrice: order.payment.originalTotalProductPrice,
                    originalShippingFee: order.payment.originalShippingFee,
                    sellerDiscount: order.payment.sellerDiscount,
                    platformDiscount: order.payment.platformDiscount,
                    shippingFee: order.payment.shippingFee,
                    shippingFeeCofundedDiscount: order.payment.shippingFeeCofundedDiscount,
                    shippingFeePlatformDiscount: order.payment.shippingFeePlatformDiscount,
                    shippingFeeSellerDiscount: order.payment.shippingFeeSellerDiscount,
                };

                allPayments.push({
                    orderId: dbOrderId,
                    currency: order.payment.currency,
                    totalAmount: order.payment.totalAmount,
                    subTotal: order.payment.subTotal,
                    tax: order.payment.tax,
                    channelData: JSON.stringify(paymentChannelData),
                });
            }

            // Collect addresses for unified OrderRecipientAddress model
            if (order.recipientAddress) {
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

                allAddresses.push({
                    orderId: dbOrderId,
                    fullAddress: order.recipientAddress.fullAddress,
                    name: order.recipientAddress.name,
                    phoneNumber: order.recipientAddress.phoneNumber,
                    postalCode: order.recipientAddress.postalCode || "",
                    channelData: JSON.stringify(addressChannelData),
                });
            }

            // Collect packages for unified OrderPackage model
            if (order.packages) {
                for (const pkg of order.packages) {
                    allPackages.push({
                        orderId: dbOrderId,
                        packageId: pkg.id,
                        channelData: JSON.stringify({}), // Can store package-specific data if needed
                    });
                }
            }
        }

        // Batch upsert using unified models
        if (allLineItems.length > 0) {
            await prisma.orderLineItem.deleteMany({
                where: { orderId: { in: Array.from(orderIdMap.values()) } }
            });
            await prisma.orderLineItem.createMany({
                data: allLineItems
            });
        }

        if (allPayments.length > 0) {
            await prisma.orderPayment.deleteMany({
                where: { orderId: { in: Array.from(orderIdMap.values()) } }
            });
            await prisma.orderPayment.createMany({
                data: allPayments
            });
        }

        if (allAddresses.length > 0) {
            await prisma.orderRecipientAddress.deleteMany({
                where: { orderId: { in: Array.from(orderIdMap.values()) } }
            });

            const addressInserts = allAddresses.map(({ channelData, ...address }) => ({
                ...address,
                channelData
            }));
            await prisma.orderRecipientAddress.createMany({
                data: addressInserts
            });

            // Handle district info for unified AddressDistrict model
            const newAddresses = await prisma.orderRecipientAddress.findMany({
                where: { orderId: { in: Array.from(orderIdMap.values()) } },
                select: { id: true, orderId: true, channelData: true }
            });

            const allDistricts = [];
            for (const address of newAddresses) {
                try {
                    const channelData = JSON.parse(address.channelData || '{}');
                    const districtInfo = channelData.districtInfo || [];

                    for (const district of districtInfo) {
                        allDistricts.push({
                            addressLevel: district.addressLevel,
                            addressLevelName: district.addressLevelName,
                            addressName: district.addressName,
                            recipientAddressId: address.id,
                        });
                    }
                } catch (error) {
                    console.warn('Failed to parse address channelData:', error);
                }
            }

            if (allDistricts.length > 0) {
                await prisma.addressDistrict.createMany({
                    data: allDistricts
                });
            }
        }

        if (allPackages.length > 0) {
            await prisma.orderPackage.deleteMany({
                where: { orderId: { in: Array.from(orderIdMap.values()) } }
            });
            await prisma.orderPackage.createMany({
                data: allPackages
            });
        }
    } catch (error) {
        console.error('Error processing batch:', error);
        throw error;
    }
}