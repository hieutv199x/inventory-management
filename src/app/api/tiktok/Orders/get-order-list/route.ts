import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import {
    Order202309GetOrderListRequestBody,
    TikTokShopNodeApiClient,
} from "@/nodejs_sdk";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
    try {
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

        // Lấy thông tin shop và app
        const credentials = await prisma.shopAuthorization.findUnique({
            where: {
                shopId: shop_id,
            },
            include: {
                app: true,
            },
        });

        if (!credentials) {
            return NextResponse.json({ error: "Shop not found" }, { status: 404 });
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

        // If sync is true, store the data in database
        if (sync && result.body?.data?.orders) {
            await syncOrdersToDatabase(result.body.data.orders, shop_id);
        }

        return NextResponse.json(result.body);
    } catch (err: any) {
        console.error("Error getting orders:", err);
        return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 });
    }
}

async function syncOrdersToDatabase(orders: any[], shopId: string) {
    for (const order of orders) {
        try {
            // Ensure createTime is always available - use current timestamp as fallback
            const createTime = order.createTime || Math.floor(Date.now() / 1000);
            
            // Upsert order
            const savedOrder = await prisma.tikTokOrder.upsert({
                where: { orderId: order.id },
                create: {
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
                },
                update: {
                    status: order.status || "UNKNOWN",
                    updateTime: order.updateTime,
                    deliveryTime: order.deliveryTime,
                    paidTime: order.paidTime,
                    trackingNumber: order.trackingNumber,
                    buyerMessage: order.buyerMessage || "",
                    paymentMethodName: order.paymentMethodName,
                    shippingProvider: order.shippingProvider,
                }
            });

            // Sync line items
            if (order.lineItems) {
                for (const item of order.lineItems) {
                    await prisma.tikTokOrderLineItem.upsert({
                        where: { lineItemId: item.id },
                        create: {
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
                            orderId: savedOrder.id,
                        },
                        update: {
                            displayStatus: item.displayStatus,
                            packageStatus: item.packageStatus,
                            salePrice: item.salePrice,
                            trackingNumber: item.trackingNumber,
                            productName: item.productName,
                            skuName: item.skuName || "",
                        }
                    });
                }
            }

            // Sync payment information
            if (order.payment) {
                await prisma.tikTokOrderPayment.upsert({
                    where: { orderId: savedOrder.id },
                    create: {
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
                        orderId: savedOrder.id,
                    },
                    update: {
                        totalAmount: order.payment.totalAmount,
                        subTotal: order.payment.subTotal,
                        tax: order.payment.tax,
                        shippingFee: order.payment.shippingFee,
                        originalTotalProductPrice: order.payment.originalTotalProductPrice,
                        originalShippingFee: order.payment.originalShippingFee,
                    }
                });
            }

            // Sync recipient address
            if (order.recipientAddress) {
                const recipientAddress = await prisma.tikTokOrderRecipientAddress.upsert({
                    where: { orderId: savedOrder.id },
                    create: {
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
                        orderId: savedOrder.id,
                    },
                    update: {
                        addressDetail: order.recipientAddress.addressDetail,
                        addressLine1: order.recipientAddress.addressLine1,
                        addressLine2: order.recipientAddress.addressLine2 || "",
                        addressLine3: order.recipientAddress.addressLine3 || "",
                        addressLine4: order.recipientAddress.addressLine4 || "",
                        fullAddress: order.recipientAddress.fullAddress,
                        firstName: order.recipientAddress.firstName || "",
                        lastName: order.recipientAddress.lastName || "",
                        name: order.recipientAddress.name,
                        phoneNumber: order.recipientAddress.phoneNumber,
                        postalCode: order.recipientAddress.postalCode || "",
                    }
                });

                // Sync district info
                if (order.recipientAddress.districtInfo) {
                    // Delete existing districts and recreate
                    await prisma.tikTokAddressDistrict.deleteMany({
                        where: { recipientAddressId: recipientAddress.id }
                    });

                    for (const district of order.recipientAddress.districtInfo) {
                        await prisma.tikTokAddressDistrict.create({
                            data: {
                                addressLevel: district.addressLevel,
                                addressLevelName: district.addressLevelName,
                                addressName: district.addressName,
                                recipientAddressId: recipientAddress.id,
                            }
                        });
                    }
                }
            }

            // Sync packages
            if (order.packages) {
                for (const pkg of order.packages) {
                    await prisma.tikTokOrderPackage.upsert({
                        where: {
                            orderId_packageId: {
                                orderId: savedOrder.id,
                                packageId: pkg.id
                            }
                        },
                        create: {
                            packageId: pkg.id,
                            orderId: savedOrder.id,
                        },
                        update: {}
                    });
                }
            }

        } catch (error) {
            console.error(`Error syncing order ${order.id}:`, error);
        }
    }
}