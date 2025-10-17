import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, Prisma } from "@prisma/client";
import {
    Order202309GetOrderListRequestBody,
    TikTokShopNodeApiClient,
} from "@/nodejs_sdk";
import { getUserWithShopAccess } from "@/lib/auth";
import { syncOrderCanSplitOrNot } from "@/lib/tiktok-order-sync-fulfillment-state";
import {
    isNegativeTrackingDescription,
    markOrderAsProblemInTransit,
    prepareTrackingEventRecords,
    trackingEventsIndicateProblem
} from "@/lib/tiktok-tracking-utils";
import { OrgContext, requireOrg, resolveOrgContext } from "@/lib/tenant-context";
import { triggerTrackingForOrders } from "@/lib/fulfillment-tracking";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
    try {
        const { user, accessibleShopIds, isAdmin } = await getUserWithShopAccess(req, prisma);

        const orgResult = await resolveOrgContext(req, prisma);
        const org = requireOrg(orgResult);

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
        const baseUrl = credentials.app.BaseUrl ?? process.env.TIKTOK_BASE_URL;

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
            await syncOrdersToDatabase(allOrders, credentials.id, client, credentials, shopCipher, org); // Pass additional parameters

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

async function syncOrdersToDatabase(orders: any[], shopId: string, client: any, credentials: any, shopCipher: string | undefined, org: OrgContext) {
    const BATCH_SIZE = 50;
    console.log(`Starting sync of ${orders.length} orders in batches of ${BATCH_SIZE}`);

    // Process orders in batches
    for (let i = 0; i < orders.length; i += BATCH_SIZE) {
        const batch = orders.slice(i, i + BATCH_SIZE);
        await processBatch(batch, shopId, client, credentials, shopCipher, org);
        console.log(`Processed ${Math.min(i + BATCH_SIZE, orders.length)} of ${orders.length} orders`);
    }

    console.log('Sync completed');
}

async function processBatch(orders: any[], shopId: string, client: any, credentials: any, shopCipher: string | undefined, org: OrgContext) {
    try {
        // Removed prisma.$transaction (MongoDB setup - no relational transactions)
        // 1. Determine existing vs new orders
        const orderIds = orders.map(o => o.id);
        const existingOrders = await prisma.order.findMany({
            where: { orderId: { in: orderIds } },
            select: { id: true, orderId: true, status: true }
        });

        const existingOrderMap = new Map(existingOrders.map(o => [o.orderId, { id: o.id, status: o.status }]));
        const newOrders: any[] = [];
        const updateOrders: any[] = [];
        const statusChangedOrderIds: string[] = [];

        for (const order of orders) {
            const createTime = order.createTime || Math.floor(Date.now() / 1000);
            const channelData = {
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
                userId: order.userId,
                warehouseId: order.warehouseId,
                isBuyerRequestCancel: order.isBuyerRequestCancel || false,
                handlingDuration: order.handlingDuration || null,
            };

            const orderData: any = {
                orderId: order.id,
                channel: 'TIKTOK' as any,
                buyerEmail: order.buyerEmail || "",
                buyerMessage: order.buyerMessage || "",
                createTime,
                updateTime: order.updateTime,
                status: order.status || "UNKNOWN",
                totalAmount: order.payment?.totalAmount || null,
                currency: order.payment?.currency || null,
                paidTime: order.paidTime,
                deliveryTime: order.deliveryTime,
                channelData: JSON.stringify(channelData),
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

            const existingRecord = existingOrderMap.get(order.id);

            if (existingRecord) {
                updateOrders.push({ orderData: { ...orderData }, dbId: existingRecord.id });

                if (existingRecord.status !== (order.status || "UNKNOWN")) {
                    statusChangedOrderIds.push(order.id);
                }
            } else {
                newOrders.push({
                    ...orderData, shopId,
                    orgId: org.id,
                });
            }

            // Sync order attributes like can_split, must_split
            await syncOrderCanSplitOrNot(prisma, {
                shop_id: shopId,
                order_ids: [order.id] // Pass as array for future extensibility
            });

        }

        // 2. Insert new orders
        if (newOrders.length > 0) {
            await prisma.order.createMany({
                data: newOrders
            });
        }

        // 3. Update existing orders
        if (updateOrders.length > 0) {
            await Promise.all(
                updateOrders.map(o =>
                    prisma.order.update({
                        where: { id: o.dbId },
                        data: {
                            ...o.orderData
                        }
                    })
                )
            );
        }

        // 4. Refetch DB order IDs
        const allOrders = await prisma.order.findMany({
            where: { orderId: { in: orderIds } },
            select: { id: true, orderId: true }
        });
        const orderIdMap = new Map(allOrders.map(o => [o.orderId, o.id]));
        const orderDbIds = Array.from(orderIdMap.values());

        // 5. Collect related entities
        const allLineItems: any[] = [];
        const allPayments: any[] = [];
        const allAddresses: any[] = [];
        const allPackages: any[] = [];

        for (const order of orders) {
            const dbOrderId = orderIdMap.get(order.id);
            if (!dbOrderId) continue;

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
                        orgId: org.id
                    });
                }
            }

            if (order.payment) {
                const paymentChannelData = {
                    originalTotalProductPrice: order.payment.originalTotalProductPrice,
                    originalShippingFee: order.payment.originalShippingFee,
                    sellerDiscount: order.payment.sellerDiscount,
                    platformDiscount: order.payment.platformDiscount,
                    shippingFee: order.payment.shippingFee,
                    shippingFeeCofundedDiscount: order.payment.shippingFeeCofundedDiscount,
                    shippingFeePlatformDiscount: order.payment.shippingFeePlatformDiscount,
                    shippingFeeSellerDiscount: order.payment.shippingFeeSellerDiscount
                };
                allPayments.push({
                    orderId: dbOrderId,
                    currency: order.payment.currency,
                    totalAmount: order.payment.totalAmount,
                    subTotal: order.payment.subTotal,
                    tax: order.payment.tax,
                    channelData: JSON.stringify(paymentChannelData)
                });
            }

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
                    channelData: JSON.stringify(addressChannelData)
                });
            }

            if (order.packages) {
                for (const pkg of order.packages) {
                    try {
                        // Get package detail from TikTok API
                        const packageDetailResult = await client.api.FulfillmentV202309Api.PackagesPackageIdGet(
                            pkg.id,
                            credentials.accessToken,
                            "application/json",
                            shopCipher
                        );

                        let packageData: any = {
                            orderId: dbOrderId,
                            packageId: pkg.id,
                            orgId: org.id
                        };

                        let packageChannelData: any = {
                            originalPackageData: pkg, // Store original package data from order
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
                            if (packageDetail.pickupSlot?.startTime !== undefined) apiFields.pickupSlotStartTime = packageDetail.pickupSlot.startTime;
                            if (packageDetail.pickupSlot?.endTime !== undefined) apiFields.pickupSlotEndTime = packageDetail.pickupSlot.endTime;
                            if (packageDetail.handoverMethod !== undefined) apiFields.handoverMethod = packageDetail.handoverMethod;

                            packageData = {
                                ...packageData,
                                ...apiFields
                            };

                            // Store full API response in channelData for future reference
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
                        allPackages.push(packageData);

                        // Add small delay to avoid rate limiting
                        await new Promise(resolve => setTimeout(resolve, 100));

                    } catch (packageError) {
                        console.warn(`Failed to fetch package detail for ${pkg.id}:`, packageError);

                        // Still add the package with basic info if API call fails
                        allPackages.push({
                            orderId: dbOrderId,
                            packageId: pkg.id,
                            channelData: JSON.stringify({
                                originalPackageData: pkg,
                                fetchError: packageError instanceof Error ? packageError.message : String(packageError),
                                fetchedAt: Date.now(),
                                fetchSuccess: false
                            })
                        });
                    }
                }
            }

            await ensureTrackingInformationForOrder(
                order.id,
                dbOrderId,
                client,
                credentials.accessToken,
                shopCipher
            );
        }

        // 6. Replace related entities (delete + recreate for batch consistency)
        if (allLineItems.length > 0) {
            await prisma.orderLineItem.deleteMany({ where: { orderId: { in: orderDbIds } } });
            await prisma.orderLineItem.createMany({ data: allLineItems });
        }

        if (allPayments.length > 0) {
            await prisma.orderPayment.deleteMany({ where: { orderId: { in: orderDbIds } } });
            await prisma.orderPayment.createMany({ data: allPayments });
        }

        if (allAddresses.length > 0) {
            await prisma.orderRecipientAddress.deleteMany({ where: { orderId: { in: orderDbIds } } });
            await prisma.orderRecipientAddress.createMany({ data: allAddresses });

            const newAddresses = await prisma.orderRecipientAddress.findMany({
                where: { orderId: { in: orderDbIds } },
                select: { id: true, channelData: true }
            });

            const allDistricts: any[] = [];
            for (const addr of newAddresses) {
                try {
                    const channelData = JSON.parse(addr.channelData || '{}');
                    const districtInfo = channelData.districtInfo || [];
                    for (const d of districtInfo) {
                        allDistricts.push({
                            addressLevel: d.addressLevel,
                            addressLevelName: d.addressLevelName,
                            addressName: d.addressName,
                            recipientAddressId: addr.id
                        });
                    }
                } catch (e) {
                    console.warn('Failed to parse address channelData:', e);
                }
            }
            if (allDistricts.length > 0) {
                // Optionally could delete existing districts for these addresses first if duplicates appear
                await prisma.addressDistrict.createMany({ data: allDistricts });
            }
        }

        if (allPackages.length > 0) {
            await prisma.orderPackage.deleteMany({ where: { orderId: { in: orderDbIds } } });
            await prisma.orderPackage.createMany({ data: allPackages });

            const packagesWithTracking = allPackages.filter(pkg => {
                if (typeof pkg.trackingNumber !== "string") {
                    return false;
                }
                return pkg.trackingNumber.trim().length > 0;
            });

            if (packagesWithTracking.length > 0) {
                const now = new Date();
                const candidateMap = new Map<string, Prisma.FulfillmentTrackingStateCreateManyInput>();

                for (const pkg of packagesWithTracking) {
                    const trackingNumber = pkg.trackingNumber.trim();
                    const key = `${pkg.orderId}:${trackingNumber}`;
                    if (candidateMap.has(key)) {
                        continue;
                    }

                    candidateMap.set(key, {
                        orderId: pkg.orderId,
                        trackingNumber,
                        shopId: shopId,
                        providerName: pkg.shippingProviderName ?? undefined,
                        providerType: pkg.shippingType ?? undefined,
                        providerServiceLevel: pkg.deliveryOptionName ?? undefined,
                        status: pkg.status ?? undefined,
                        orgId: pkg.orgId ?? org.id,
                        createdAt: now,
                        updatedAt: now,
                    });
                }

                const candidateEntries = Array.from(candidateMap.entries());
                if (candidateEntries.length > 0) {
                    const existingStates = await prisma.fulfillmentTrackingState.findMany({
                        where: {
                            OR: candidateEntries.map(([, state]) => ({
                                orderId: state.orderId,
                                trackingNumber: state.trackingNumber,
                            })),
                        },
                        select: { orderId: true, trackingNumber: true },
                    });

                    const existingKeys = new Set(
                        existingStates.map(state => `${state.orderId}:${state.trackingNumber}`)
                    );

                    const statesToInsert = candidateEntries
                        .filter(([key]) => !existingKeys.has(key))
                        .map(([, state]) => state);

                    if (statesToInsert.length > 0) {
                        const orderPackagesForStates = await prisma.orderPackage.findMany({
                            where: {
                                OR: statesToInsert.map(state => ({
                                    orderId: state.orderId,
                                    trackingNumber: state.trackingNumber,
                                })),
                            },
                            select: { id: true, orderId: true, trackingNumber: true },
                        });

                        const orderPackageIdMap = new Map<string, string>(
                            orderPackagesForStates.flatMap(pkg => {
                                if (typeof pkg.trackingNumber !== "string") {
                                    return [] as Array<[string, string]>;
                                }
                                const trackingNumber = pkg.trackingNumber.trim();
                                if (trackingNumber.length === 0) {
                                    return [] as Array<[string, string]>;
                                }
                                return [[`${pkg.orderId}:${trackingNumber}`, pkg.id]];
                            })
                        );

                        const statesWithPackageLink = statesToInsert.map(state => {
                            const key = `${state.orderId}:${state.trackingNumber}`;
                            const orderPackageId = orderPackageIdMap.get(key);
                            return orderPackageId ? { ...state, orderPackageId } : state;
                        });

                        await prisma.fulfillmentTrackingState.createMany({
                            data: statesWithPackageLink,
                        });
                    }
                }

                // call triggerTrackingForOrders for these orders
                await triggerTrackingForOrders(prisma, Array.from(new Set(packagesWithTracking.map(p => {
                    return p.orderId;
                }))).filter((v): v is string => v !== null));
                
            }
        }

    } catch (error) {
        console.error('Error processing batch (non-transactional):', error);
        throw error;
    }
}

async function ensureTrackingInformationForOrder(
    tiktokOrderId: string,
    prismaOrderId: string,
    client: TikTokShopNodeApiClient,
    accessToken: string,
    shopCipher: string | undefined
): Promise<void> {
    try {
        const existingTrackingInfos = await prisma.orderTrackingInfo.findMany({
            where: { orderId: prismaOrderId },
            select: { description: true }
        });

        if (existingTrackingInfos.some(info => isNegativeTrackingDescription(info.description))) {
            await markOrderAsProblemInTransit(prisma, prismaOrderId);
        }

        if (existingTrackingInfos.length > 0) {
            return;
        }

        const trackingInfo = await client.api.FulfillmentV202309Api.OrdersOrderIdTrackingGet(
            tiktokOrderId,
            accessToken,
            "application/json",
            shopCipher
        );

        const trackingEvents = trackingInfo?.body?.data?.tracking;
        if (!Array.isArray(trackingEvents) || trackingEvents.length === 0) {
            return;
        }

        if (trackingEventsIndicateProblem(trackingEvents)) {
            await markOrderAsProblemInTransit(prisma, prismaOrderId);
        }

        const preparedEvents = prepareTrackingEventRecords(prismaOrderId, trackingEvents);
        if (preparedEvents.length === 0) {
            return;
        }

        await prisma.orderTrackingInfo.createMany({ data: preparedEvents });
    } catch (error) {
        console.warn(`Failed to ensure tracking info for order ${tiktokOrderId}:`, error);
    }
}