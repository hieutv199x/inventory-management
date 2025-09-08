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

        // Get shop and app info using unified schema
        const credentials = await prisma.shopAuthorization.findUnique({
            where: {
                id: shop_id,
                status: 'ACTIVE', // Only allow active shops
            },
            include: {
                app: true,
            },
        });

        if (!credentials) {
            return NextResponse.json({ error: "Shop not found or inactive" }, { status: 404 });
        }

        // Ensure this is a TikTok shop
        if (credentials.app?.channel !== 'TIKTOK') {
            return NextResponse.json({ error: "Not a TikTok shop" }, { status: 400 });
        }

        const app_key = credentials.app.appKey;
        const app_secret = credentials.app.appSecret;
        const baseUrl = process.env.TIKTOK_BASE_URL;

        // Extract shopCipher from channelData
        let shopCipher: string | undefined = credentials.shopCipher ?? undefined; // Legacy field
        if (credentials.channelData) {
            try {
                const channelData = JSON.parse(credentials.channelData);
                shopCipher = channelData.shopCipher ?? shopCipher ?? undefined;
            } catch (error) {
                console.warn('Failed to parse channelData, using legacy shopCipher');
            }
        }

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
            shopCipher, // Use extracted shopCipher
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
                        shopCipher, // Use extracted shopCipher
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
            await syncOrdersToDatabase(allOrders, credentials.id); // Use credentials.id (ObjectId) instead of shop_id
            
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
            const existingOrders = await tx.order.findMany({ // Use unified Order model
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
                    shopId: shopId, // This should be the ObjectId from ShopAuthorization
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
                await tx.order.createMany({ // Use unified Order model
                    data: newOrders
                });
            }

            // Batch update existing orders
            if (updateOrders.length > 0) {
                const updatePromises = updateOrders.map(order => 
                    tx.order.update({ // Use unified Order model
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
            const allOrders = await tx.order.findMany({ // Use unified Order model
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
                await tx.orderLineItem.deleteMany({ // Use unified model
                    where: { orderId: { in: Array.from(orderIdMap.values()) } }
                });
                await tx.orderLineItem.createMany({ // Use unified model
                    data: allLineItems
                });
            }

            if (allPayments.length > 0) {
                await tx.orderPayment.deleteMany({ // Use unified model
                    where: { orderId: { in: Array.from(orderIdMap.values()) } }
                });
                await tx.orderPayment.createMany({ // Use unified model
                    data: allPayments
                });
            }

            if (allAddresses.length > 0) {
                await tx.orderRecipientAddress.deleteMany({ // Use unified model
                    where: { orderId: { in: Array.from(orderIdMap.values()) } }
                });

                const addressInserts = allAddresses.map(({ channelData, ...address }) => ({
                    ...address,
                    channelData
                }));
                await tx.orderRecipientAddress.createMany({ // Use unified model
                    data: addressInserts
                });

                // Handle district info for unified AddressDistrict model
                const newAddresses = await tx.orderRecipientAddress.findMany({ // Use unified model
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
                    await tx.addressDistrict.createMany({ // Use unified model
                        data: allDistricts
                    });
                }
            }

            if (allPackages.length > 0) {
                await tx.orderPackage.deleteMany({ // Use unified model
                    where: { orderId: { in: Array.from(orderIdMap.values()) } }
                });
                await tx.orderPackage.createMany({ // Use unified model
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