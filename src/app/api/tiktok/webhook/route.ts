import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, ShopAuthorization } from "@prisma/client";
import crypto from 'crypto';
import { Order202309GetOrderDetailResponseDataOrders, TikTokShopNodeApiClient } from "@/nodejs_sdk";

const prisma = new PrismaClient();

interface TikTokWebhookData {
    type: number;
    tts_notification_id: string;
    shop_id: string;
    timestamp: number;
    data: {
        is_on_hold_order: boolean;
        order_id: string;
        order_status: string;
        update_time: number;
        fulfillment_orders?: {
            fulfillment_order_id: string;
            fulfillment_order_status: string;
            tracking_number?: string;
            shipping_provider?: string;
            line_items?: {
                product_id: string;
                sku_id: string;
                seller_sku: string;
                quantity: number;
                fulfillment_status: string;
            }[];
        }[];
        cancel_reason?: string;
        cancel_user?: string;
    };
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.text();
        // const signature = request.headers.get('x-tts-signature');
        // const timestamp = request.headers.get('x-tts-timestamp');

        // console.log('TikTok Webhook received:', {
        //     signature: signature ? 'present' : 'missing',
        //     timestamp,
        //     bodyLength: body.length,
        //     body: body
        // });

        // Parse the webhook data
        let webhookData: TikTokWebhookData;
        try {
            webhookData = JSON.parse(body);
        } catch (error) {
            console.error('Invalid JSON in webhook body:', error);
            return NextResponse.json({
                code: 40001,
                message: 'Invalid JSON format',
                data: null
            }, { status: 400 });
        }

        console.log('Parsed webhook data:', JSON.stringify(webhookData, null, 2));

        // Verify webhook signature if signature is provided
        // if (signature && timestamp) {
        //     const isValid = await verifyWebhookSignature(body, signature, webhookData.shop_id, timestamp);
        //     if (!isValid) {
        //         console.error('Invalid webhook signature');
        //         return NextResponse.json({
        //             code: 40003,
        //             message: 'Invalid signature',
        //             data: null
        //         }, { status: 401 });
        //     }
        // }

        // Handle different webhook types
        switch (webhookData.type) {
            case 1: // ORDER_STATUS_CHANGE
                await handleOrderStatusChange(webhookData);
                break;
            default:
                console.log(`Unhandled webhook type: ${webhookData.type}`);
        }

        // Return success response as required by TikTok
        return NextResponse.json({
            code: 0,
            message: 'success',
            data: null
        }, { status: 200 });

    } catch (error) {
        console.error('Error processing TikTok webhook:', error);
        return NextResponse.json({
            code: 50000,
            message: 'Internal server error',
            data: null
        }, { status: 500 });
    }
}

async function verifyWebhookSignature(body: string, signature: string, shopId: string, timestamp: string): Promise<boolean> {
    try {
        // Get shop credentials to get the app secret for signature verification
        const credentials = await prisma.shopAuthorization.findUnique({
            where: { shopId },
            include: { app: true }
        });

        if (!credentials || !credentials.app) {
            console.error('Shop credentials not found for signature verification');
            return false;
        }

        const appSecret = credentials.app.appSecret;

        // TikTok webhook signature verification
        // The signature is HMAC-SHA256 of the request body + timestamp using app secret
        const expectedSignature = crypto
            .createHmac('sha256', appSecret)
            .update(body + timestamp)
            .digest('hex');

        const isValid = signature === expectedSignature;
        console.log('Signature verification:', {
            provided: signature,
            expected: expectedSignature,
            isValid
        });

        return isValid;
    } catch (error) {
        console.error('Error verifying webhook signature:', error);
        return false;
    }
}

async function handleOrderStatusChange(webhookData: TikTokWebhookData) {
    try {
        const { shop_id, data } = webhookData;
        const { order_id, order_status, update_time, is_on_hold_order } = data;

        console.log(`Processing order status change: ${order_id} -> ${order_status}`);

        // Get shop credentials
        const credentials = await prisma.shopAuthorization.findUnique({
            where: { shopId:shop_id },
            include: { app: true }
        });


        // Find the order in our database
        const existingOrder = await prisma.order.findFirst({
            where: {
                orderId: order_id,
                shopId: credentials?.id
            }
        });

        if (!existingOrder) {
            console.log(`Order ${order_id} not found in database, will sync from API`);
            // Optionally trigger a sync for this specific order
            await syncOrderFromTikTok(credentials, order_id);
            return;
        }

        // Update order status and other relevant fields
        const updateData: any = {
            status: order_status,
            updateTime: update_time,
        };

        // Handle on hold status
        if (is_on_hold_order !== undefined) {
            let channelData = {};
            try {
                channelData = JSON.parse(existingOrder.channelData || '{}');
            } catch (error) {
                console.warn('Failed to parse existing channelData');
            }

            channelData = {
                ...channelData,
                isOnHoldOrder: is_on_hold_order,
                lastWebhookUpdate: Date.now(),
                lastWebhookTimestamp: webhookData.timestamp,
                notificationId: webhookData.tts_notification_id
            };
            updateData.channelData = JSON.stringify(channelData);
        }

        // Update the order in database
        await prisma.order.update({
            where: { id: existingOrder.id },
            data: updateData
        });

        console.log(`Successfully updated order ${order_id} status to ${order_status}`);

        // Handle specific status changes for business logic
        await handleSpecificStatusChanges(existingOrder.id, order_status, webhookData);

    } catch (error) {
        console.error('Error handling order status change:', error);
        throw error;
    }
}

async function handleSpecificStatusChanges(orderId: string, newStatus: string, webhookData: TikTokWebhookData) {
    // Handle specific business logic for different status changes
    switch (newStatus.toLowerCase()) {
        case 'awaiting_shipment':
            console.log(`Order ${webhookData.data.order_id} is awaiting shipment`);
            // Could trigger notifications, update inventory, etc.
            break;

        case 'in_transit':
            console.log(`Order ${webhookData.data.order_id} is in transit`);
            // Could send tracking notifications to customers
            break;

        case 'delivered':
            console.log(`Order ${webhookData.data.order_id} has been delivered`);
            // Could trigger completion workflows, review requests, etc.
            // Auto-update customStatus to DELIVERED
            try {
                await prisma.order.update({
                    where: { id: orderId },
                    data: { customStatus: 'DELIVERED' }
                });
                console.log(`Auto-updated customStatus to DELIVERED for order ${webhookData.data.order_id}`);
            } catch (error) {
                console.error('Error updating customStatus:', error);
            }
            break;

        case 'cancelled':
            console.log(`Order ${webhookData.data.order_id} has been cancelled`);
            // Could trigger refund processes, inventory updates, etc.
            break;

        default:
            console.log(`Order ${webhookData.data.order_id} status changed to ${newStatus}`);
    }
}

async function syncOrderFromTikTok(credentials: any, orderId: string) {
    try {
        console.log(`Syncing order ${orderId} from TikTok API`);

        if (!credentials || !credentials.app) {
            console.error('Shop credentials not found for order sync');
            return;
        }

        const app_key = credentials.app.appKey;
        const app_secret = credentials.app.appSecret;
        const baseUrl = process.env.TIKTOK_BASE_URL;
        let shopCipher: string | undefined = credentials.shopCipher ?? undefined;

        // Extract shopCipher from channelData if available
        if (credentials.channelData) {
            try {
                const channelData = JSON.parse(credentials.channelData);
                shopCipher = channelData.shopCipher ?? shopCipher;
            } catch (error) {
                console.warn('Failed to parse channelData, using legacy shopCipher');
            }
        }

        const client = new TikTokShopNodeApiClient({
            config: {
                basePath: baseUrl,
                app_key: app_key,
                app_secret: app_secret,
            },
        });

        // Fetch order details from TikTok API
        const result = await client.api.OrderV202309Api.OrdersGet(
            [orderId],
            credentials.accessToken,
            "application/json",
            shopCipher
        );

        if (!result.body.data || !result.body.data.orders || result.body.data.orders.length === 0) {
            console.error(`No order data returned for order ${orderId}`);
            return;
        }

        const orderData = result.body.data.orders[0];
        await insertOrderWithAssociations(orderData, credentials.id);

        console.log(`Order ${orderId} sync completed successfully`);
    } catch (error) {
        console.error(`Error syncing order ${orderId}:`, error);
    }
}

async function insertOrderWithAssociations(orderData: Order202309GetOrderDetailResponseDataOrders, shopId: any) {
    try {
        // Start a transaction to ensure data consistency
        await prisma.$transaction(async (tx) => {
            console.log(`Inserting order ${orderData.id} with all associations`);

            // 1. Create the main order first (without relations)
            const order = await tx.order.create({
                data: {
                    orderId: orderData.id ?? "",
                    shopId: shopId,
                    buyerEmail: orderData.buyerEmail || '',
                    status: orderData.status || 'PENDING',
                    createTime: orderData.createTime || Math.floor(Date.now() / 1000),
                    updateTime: orderData.updateTime || Math.floor(Date.now() / 1000),
                    paidTime: orderData.paidTime,
                    deliveryTime: orderData.deliveryTime,
                    currency: orderData.payment?.currency || 'USD',
                    buyerMessage: orderData.buyerMessage,
                    channel: 'TIKTOK',
                    customStatus: null, // Will be set by business logic
                    channelData: JSON.stringify({
                        // Order-level TikTok specific data
                        orderType: orderData.orderType,
                        fulfillmentType: orderData.fulfillmentType,
                        deliveryType: orderData.deliveryType,
                        paymentMethodName: orderData.paymentMethodName,
                        shippingProvider: orderData.shippingProvider,
                        deliveryOptionName: orderData.deliveryOptionName,
                        collectionTime: orderData.collectionTime,
                        userId: orderData.userId,
                        isOnHoldOrder: orderData.isOnHoldOrder,
                        splitOrCombineTag: orderData.splitOrCombineTag,
                        trackingNumber: orderData.trackingNumber,
                        warehouseId: orderData.warehouseId,
                        sellerNote: orderData.sellerNote
                    })
                }
            });

            // 2. Create recipient address if exists
            if (orderData.recipientAddress) {
                const addressData = orderData.recipientAddress;
                await tx.orderRecipientAddress.create({
                    data: {
                        orderId: order.id,
                        name: addressData.name || '',
                        phoneNumber: addressData.phoneNumber || '',
                        fullAddress: addressData.fullAddress || '',
                        postalCode: addressData.postalCode || '',
                        channelData: JSON.stringify({
                            // TikTok specific address fields
                            firstName: addressData.firstName,
                            lastName: addressData.lastName,
                            districtInfo: addressData.districtInfo,
                            deliveryPreferences: addressData.deliveryPreferences,
                            addressDetail: addressData.addressDetail,
                            addressLine1: addressData.addressLine1,
                            addressLine2: addressData.addressLine2,
                            addressLine3: addressData.addressLine3,
                            addressLine4: addressData.addressLine4
                        })
                    }
                });
            }

            // 3. Create payment information if exists
            if (orderData.payment) {
                const paymentData = orderData.payment;
                await tx.orderPayment.create({
                    data: {
                        orderId: order.id,
                        currency: paymentData.currency || 'USD',
                        totalAmount: paymentData.totalAmount?.toString() || '0',
                        subTotal: paymentData.subTotal?.toString() || '0',
                        channelData: JSON.stringify({
                            // TikTok specific payment fields
                            originalTotalProductPrice: paymentData.originalTotalProductPrice,
                            originalShippingFee: paymentData.originalShippingFee,
                            shippingFee: paymentData.shippingFee,
                            retailDeliveryFee: paymentData.retailDeliveryFee,
                            buyerServiceFee: paymentData.buyerServiceFee
                        })
                    }
                });
            }

            // 4. Create line items
            if (orderData.lineItems && orderData.lineItems.length > 0) {
                for (const item of orderData.lineItems) {
                    await tx.orderLineItem.create({
                        data: {
                            lineItemId: item.id?.toString() || crypto.randomUUID(),
                            orderId: order.id,
                            productId: item.productId?.toString() || '',
                            productName: item.productName || '',
                            skuId: item.skuId?.toString() || '',
                            skuName: item.skuName || '',
                            sellerSku: item.sellerSku || '',
                            salePrice: item.salePrice?.toString() || '0',
                            originalPrice: item.originalPrice?.toString() || '0',
                            currency: item.currency || orderData.payment?.currency || 'USD',
                            channelData: JSON.stringify({
                                // TikTok specific line item fields
                                skuImage: item.skuImage,
                                displayStatus: item.displayStatus,
                                packageId: item.packageId,
                                packageStatus: item.packageStatus,
                                skuType: item.skuType,
                                isGift: item.isGift,
                                platformDiscount: item.platformDiscount,
                                sellerDiscount: item.sellerDiscount,
                                trackingNumber: item.trackingNumber,
                                smallOrderFee: item.smallOrderFee
                            })
                        }
                    });
                }
            }

            console.log(`Successfully inserted order ${orderData.id} with ${orderData.lineItems?.length || 0} line items`);
        });

    } catch (error) {
        console.error('Error inserting order with associations:', error);
        throw error;
    }
}

// GET endpoint for webhook verification (if TikTok requires it)
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const challenge = searchParams.get('hub.challenge');
    const verify_token = searchParams.get('hub.verify_token');

    // Verify the token matches your configured verification token
    const expectedToken = process.env.TIKTOK_WEBHOOK_VERIFY_TOKEN || 'your_verify_token';

    console.log('Webhook verification attempt:', { challenge, verify_token, expectedToken });

    if (verify_token === expectedToken && challenge) {
        return new Response(challenge, { status: 200 });
    }

    return NextResponse.json({ error: 'Invalid verification' }, { status: 403 });
}
