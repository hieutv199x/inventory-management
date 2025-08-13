import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import {
    Order202309GetOrderListRequestBody,
    TikTokShopNodeApiClient,
} from "@/nodejs_sdk";
import { getUserWithShopAccess, getActiveShopIds } from "@/lib/auth";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
    try {
        const { user, accessibleShopIds, isAdmin } = await getUserWithShopAccess(req, prisma);

        const {
            shop_id,
            sort_by = "create_time",
            sort_direction = "ASC",
            page_size = 20,
            filters,
            sync = false, // New parameter to trigger sync
        } = await req.json();

        if (!shop_id) {
            return NextResponse.json(
                { error: "Missing required fields: shop_id" },
                { status: 400 }
            );
        }

        // Check user access to the requested shop
        if (!isAdmin && !accessibleShopIds.includes(shop_id)) {
            return NextResponse.json(
                { error: "Access denied: You don't have permission to access this shop" },
                { status: 403 }
            );
        }

        // Lấy thông tin shop và app
        const credentials = await prisma.shopAuthorization.findUnique({
            where: {
                shopId: shop_id,
                status: 'ACTIVE', // Only allow active shops
            },
            include: {
                app: true,
            },
        });

        if (!credentials) {
            return NextResponse.json({ error: "Shop not found or inactive" }, { status: 404 });
        }

        const app_key = credentials.app.appKey;
        const app_secret = credentials.app.appSecret;
        const baseUrl = process.env.TIKTOK_BASE_URL;

        // Tạo body request
        const body = new Order202309GetOrderListRequestBody();

        if (filters?.orderStatus) body.orderStatus = filters.orderStatus;
        if (filters?.createTimeGe) body.createTimeGe = filters.createTimeGe;
        if (filters?.createTimeLt) body.createTimeLt = filters.createTimeLt;
        if (filters?.updateTimeGe) body.updateTimeGe = filters.updateTimeGe;
        if (filters?.updateTimeLt) body.updateTimeLt = filters.updateTimeLt;
        if (filters?.shippingType) body.shippingType = filters.shippingType;
        if (filters?.buyerUserId) body.buyerUserId = filters.buyerUserId;
        if (filters?.isBuyerRequestCancel !== undefined)
            body.isBuyerRequestCancel = filters.isBuyerRequestCancel;
        if (filters?.warehouseIds) body.warehouseIds = filters.warehouseIds;

        // Khởi tạo client
        const client = new TikTokShopNodeApiClient({
            config: {
                basePath: baseUrl,
                app_key: app_key,
                app_secret: app_secret,
            },
        });

        // Gọi API
        const result = await client.api.OrderV202309Api.OrdersSearchPost(
            page_size,
            credentials.accessToken,
            "application/json",
            sort_direction,
            "",
            sort_by,
            credentials.shopCipher,
            body
        );

        // If sync is true, store the data in database and fetch all pages
        if (sync && result.body?.data?.orders) {
            let allOrders = [...result.body.data.orders];
            let nextPageToken = result.body.data.nextPageToken;

            // Continue fetching all pages if there are more
            while (nextPageToken) {
                try {
                    console.log(`Fetching next page with token: ${nextPageToken}`);
                    
                    const nextPageResult = await client.api.OrderV202309Api.OrdersSearchPost(
                        page_size,
                        credentials.accessToken,
                        "application/json",
                        sort_direction,
                        nextPageToken, // Use the token for next page
                        sort_by,
                        credentials.shopCipher,
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
            await syncOrdersToDatabase(allOrders, shop_id);
            
            // Return modified result with total count information
            return NextResponse.json({
                ...result.body,
                syncInfo: {
                    totalOrdersSynced: allOrders.length,
                    pagesProcessed: Math.ceil(allOrders.length / page_size)
                }
            });
        }

        return NextResponse.json(result.body);
    } catch (err: any) {
        console.error("Error getting orders:", err);
        if (err.message === 'Authentication required' || err.message === 'User not found') {
            return NextResponse.json({ error: err.message }, { status: 401 });
        }
        return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}

async function syncOrdersToDatabase(orders: any[], shopId: string) {
    const BATCH_SIZE = 100;
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
        await prisma.$transaction(async (tx) => {
            // Collect existing order IDs to determine which are new vs updates
            const orderIds = orders.map(o => o.id);
            const existingOrders = await tx.tikTokOrder.findMany({
                where: { orderId: { in: orderIds } },
                select: { id: true, orderId: true }
            });
            
            const existingOrderMap = new Map(existingOrders.map(o => [o.orderId, o.id]));
            const newOrders = [];
            const updateOrders = [];

            // Separate new orders from updates
            for (const order of orders) {
                const createTime = order.createTime || Math.floor(Date.now() / 1000);
                const orderData = {
                    orderId: order.id,
                    buyerEmail: order.buyerEmail || "",
                    buyerMessage: order.buyerMessage || "",
                    cancelOrderSlaTime: order.cancelOrderSlaTime,
                    collectionTime: order.collectionTime,
                    commercePlatform: order.commercePlatform,
                    createTime: createTime,
                    updateTime: order.updateTime,
                    deliveryOptionId: order.deliveryOptionId,
                    deliveryOptionName: order.deliveryOptionName,
                    deliveryTime: order.deliveryTime,
                    deliveryType: order.deliveryType,
                    fulfillmentType: order.fulfillmentType,
                    status: order.status || "UNKNOWN",
                    hasUpdatedRecipientAddress: order.hasUpdatedRecipientAddress || false,
                    isCod: order.isCod || false,
                    isOnHoldOrder: order.isOnHoldOrder || false,
                    isReplacementOrder: order.isReplacementOrder || false,
                    isSampleOrder: order.isSampleOrder || false,
                    orderType: order.orderType,
                    paidTime: order.paidTime,
                    paymentMethodName: order.paymentMethodName,
                    shippingProvider: order.shippingProvider,
                    shippingProviderId: order.shippingProviderId,
                    shippingType: order.shippingType,
                    trackingNumber: order.trackingNumber,
                    rtsSlaTime: order.rtsSlaTime,
                    rtsTime: order.rtsTime,
                    ttsSlaTime: order.ttsSlaTime,
                    userId: order.userId,
                    warehouseId: order.warehouseId,
                    shopId: shopId,
                };

                if (existingOrderMap.has(order.id)) {
                    updateOrders.push({
                        ...orderData,
                        dbId: existingOrderMap.get(order.id)
                    });
                } else {
                    newOrders.push(orderData);
                }
            }

            // Batch create new orders
            if (newOrders.length > 0) {
                await tx.tikTokOrder.createMany({
                    data: newOrders
                });
            }

            // Batch update existing orders
            if (updateOrders.length > 0) {
                const updatePromises = updateOrders.map(order => 
                    tx.tikTokOrder.update({
                        where: { id: order.dbId },
                        data: {
                            status: order.status,
                            updateTime: order.updateTime,
                            deliveryTime: order.deliveryTime,
                            paidTime: order.paidTime,
                            trackingNumber: order.trackingNumber,
                            buyerMessage: order.buyerMessage,
                            paymentMethodName: order.paymentMethodName,
                            shippingProvider: order.shippingProvider,
                        }
                    })
                );
                await Promise.all(updatePromises);
            }

            // Get all order IDs after insert/update
            const allOrders = await tx.tikTokOrder.findMany({
                where: { orderId: { in: orderIds } },
                select: { id: true, orderId: true }
            });
            const orderIdMap = new Map(allOrders.map(o => [o.orderId, o.id]));

            // Process line items in batches
            const allLineItems = [];
            const allPayments = [];
            const allAddresses = [];
            const allPackages = [];

            for (const order of orders) {
                const dbOrderId = orderIdMap.get(order.id);
                if (!dbOrderId) continue;

                // Collect line items
                if (order.lineItems) {
                    for (const item of order.lineItems) {
                        allLineItems.push({
                            lineItemId: item.id,
                            productId: item.productId,
                            productName: item.productName,
                            skuId: item.skuId,
                            skuName: item.skuName || "",
                            skuType: item.skuType,
                            sellerSku: item.sellerSku || "",
                            skuImage: item.skuImage,
                            currency: item.currency,
                            originalPrice: item.originalPrice,
                            salePrice: item.salePrice,
                            sellerDiscount: item.sellerDiscount,
                            platformDiscount: item.platformDiscount,
                            displayStatus: item.displayStatus,
                            isGift: item.isGift || false,
                            packageId: item.packageId,
                            packageStatus: item.packageStatus,
                            shippingProviderId: item.shippingProviderId,
                            shippingProviderName: item.shippingProviderName,
                            trackingNumber: item.trackingNumber,
                            rtsTime: item.rtsTime,
                            orderId: dbOrderId,
                        });
                    }
                }

                // Collect payments
                if (order.payment) {
                    allPayments.push({
                        orderId: dbOrderId,
                        currency: order.payment.currency,
                        originalTotalProductPrice: order.payment.originalTotalProductPrice,
                        originalShippingFee: order.payment.originalShippingFee,
                        subTotal: order.payment.subTotal,
                        totalAmount: order.payment.totalAmount,
                        tax: order.payment.tax,
                        sellerDiscount: order.payment.sellerDiscount,
                        platformDiscount: order.payment.platformDiscount,
                        shippingFee: order.payment.shippingFee,
                        shippingFeeCofundedDiscount: order.payment.shippingFeeCofundedDiscount,
                        shippingFeePlatformDiscount: order.payment.shippingFeePlatformDiscount,
                        shippingFeeSellerDiscount: order.payment.shippingFeeSellerDiscount,
                    });
                }

                // Collect addresses
                if (order.recipientAddress) {
                    allAddresses.push({
                        orderId: dbOrderId,
                        addressDetail: order.recipientAddress.addressDetail,
                        addressLine1: order.recipientAddress.addressLine1,
                        addressLine2: order.recipientAddress.addressLine2 || "",
                        addressLine3: order.recipientAddress.addressLine3 || "",
                        addressLine4: order.recipientAddress.addressLine4 || "",
                        fullAddress: order.recipientAddress.fullAddress,
                        firstName: order.recipientAddress.firstName || "",
                        firstNameLocalScript: order.recipientAddress.firstNameLocalScript || "",
                        lastName: order.recipientAddress.lastName || "",
                        lastNameLocalScript: order.recipientAddress.lastNameLocalScript || "",
                        name: order.recipientAddress.name,
                        phoneNumber: order.recipientAddress.phoneNumber,
                        postalCode: order.recipientAddress.postalCode || "",
                        regionCode: order.recipientAddress.regionCode,
                        districtInfo: order.recipientAddress.districtInfo || [],
                    });
                }

                // Collect packages
                if (order.packages) {
                    for (const pkg of order.packages) {
                        allPackages.push({
                            orderId: dbOrderId,
                            packageId: pkg.id,
                        });
                    }
                }
            }

            // Batch upsert line items
            if (allLineItems.length > 0) {
                // Delete existing line items for these orders first
                await tx.tikTokOrderLineItem.deleteMany({
                    where: { orderId: { in: Array.from(orderIdMap.values()) } }
                });
                // Insert all line items
                await tx.tikTokOrderLineItem.createMany({
                    data: allLineItems
                });
            }

            // Batch upsert payments
            if (allPayments.length > 0) {
                await tx.tikTokOrderPayment.deleteMany({
                    where: { orderId: { in: Array.from(orderIdMap.values()) } }
                });
                await tx.tikTokOrderPayment.createMany({
                    data: allPayments
                });
            }

            // Batch upsert addresses and districts
            if (allAddresses.length > 0) {
                // Delete existing addresses first
                await tx.tikTokOrderRecipientAddress.deleteMany({
                    where: { orderId: { in: Array.from(orderIdMap.values()) } }
                });

                // Insert new addresses
                const addressInserts = allAddresses.map(({ districtInfo, ...address }) => address);
                await tx.tikTokOrderRecipientAddress.createMany({
                    data: addressInserts
                });

                // Handle district info
                const newAddresses = await tx.tikTokOrderRecipientAddress.findMany({
                    where: { orderId: { in: Array.from(orderIdMap.values()) } },
                    select: { id: true, orderId: true }
                });
                const addressIdMap = new Map(newAddresses.map(a => [a.orderId, a.id]));

                const allDistricts = [];
                for (const address of allAddresses) {
                    const addressId = addressIdMap.get(address.orderId);
                    if (addressId && address.districtInfo.length > 0) {
                        for (const district of address.districtInfo) {
                            allDistricts.push({
                                addressLevel: district.addressLevel,
                                addressLevelName: district.addressLevelName,
                                addressName: district.addressName,
                                recipientAddressId: addressId,
                            });
                        }
                    }
                }

                if (allDistricts.length > 0) {
                    await tx.tikTokAddressDistrict.createMany({
                        data: allDistricts
                    });
                }
            }

            // Batch upsert packages
            if (allPackages.length > 0) {
                await tx.tikTokOrderPackage.deleteMany({
                    where: { orderId: { in: Array.from(orderIdMap.values()) } }
                });
                await tx.tikTokOrderPackage.createMany({
                    data: allPackages
                });
            }
        }, {
            maxWait: 30000,
            timeout: 60000,
        });

    } catch (error) {
        console.error('Error processing batch:', error);
        throw error;
    }
}