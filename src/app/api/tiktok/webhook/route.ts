import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, ShopAuthorization, NotificationType } from "@prisma/client";
import crypto from 'crypto';
import { Order202309GetOrderDetailResponseDataOrders, TikTokShopNodeApiClient } from "@/nodejs_sdk";
import { NotificationService } from "@/lib/notification-service";

const prisma = new PrismaClient();

interface TikTokWebhookData {
    type: number;
    tts_notification_id: string;
    shop_id: string;
    timestamp: number;
    data: {
        is_on_hold_order?: boolean;
        order_id: string;
        order_status?: string;
        update_time: number;
        // Cancellation specific fields
        cancellation_id?: string;
        cancellation_status?: string;
        cancel_reason?: string;
        cancel_user?: string;
        cancel_user_id?: string;
        cancel_time?: number;
        line_items?: Array<{
            id: string;
            cancel_quantity: number;
            cancel_reason?: string;
        }>;
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
    };
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.text();
        const signature = request.headers.get('x-tts-signature');
        const timestamp = request.headers.get('x-tts-timestamp');

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

        // Verify webhook signature if signature is provided
        if (signature && timestamp) {
            const isValid = await verifyWebhookSignature(body, signature, webhookData.shop_id, timestamp);
            if (!isValid) {
                console.error('Invalid webhook signature');
                return NextResponse.json({
                    code: 40003,
                    message: 'Invalid signature',
                    data: null
                }, { status: 401 });
            }
        }

        // Handle different webhook types
        switch (webhookData.type) {
            case 1: // ORDER_STATUS_CHANGE
                await handleOrderStatusChange(webhookData);
                break;
            case 11: // CANCELLATION_STATUS_CHANGE
                await handleCancellationStatusChange(webhookData);
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
            where: { shopId: shop_id },
            include: { app: true }
        });

        if (!credentials) {
            console.error('Shop credentials not found');
            // Create system alert notification for missing shop
            await NotificationService.createNotification({
                type: NotificationType.SYSTEM_ALERT,
                title: 'Webhook Processing Error',
                message: `Order ${order_id} webhook received for unknown shop ${shop_id}`,
                userId: 'system', // You might want to create a system user
                data: {
                    webhookType: 'ORDER_STATUS_CHANGE',
                    orderId: order_id,
                    shopId: shop_id,
                    timestamp: webhookData.timestamp
                }
            });
            return;
        }

        // Find the order in our database
        const existingOrder = await prisma.order.findFirst({
            where: {
                orderId: order_id,
                shopId: credentials.id
            }
        });

        if (!existingOrder) {
            console.log(`Order ${order_id} not found in database, will sync from API`);
            
            // Create notification about missing order being synced
            await NotificationService.createNotification({
                type: NotificationType.SYSTEM_ALERT,
                title: 'Webhook Processing Error',
                message: `Order ${order_id} webhook received for unknown shop ${shop_id}`,
                userId: 'system', // You might want to create a system user
                data: {
                    webhookType: 'ORDER_STATUS_CHANGE',
                    orderId: order_id,
                    shopId: shop_id,
                    timestamp: webhookData.timestamp,
                    message: `Order ${order_id} not found locally, syncing from TikTok API`,
                    webhookEvent: 'ORDER_STATUS_CHANGE'
                }
            });

            await syncOrderFromTikTok(credentials, order_id);
            return;
        }

        // Store previous status for notification
        const previousStatus = existingOrder.status;

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
        const updatedOrder = await prisma.order.update({
            where: { id: existingOrder.id },
            data: updateData,
            include: {
                payment: true,
                shop: true
            }
        });

        console.log(`Successfully updated order ${order_id} status to ${order_status}`);

        // Create notification for order status change (only if status actually changed)
        if (previousStatus !== order_status && credentials.id) {
            await NotificationService.createOrderNotification(
                NotificationType.ORDER_STATUS_CHANGE,
                updatedOrder,
                credentials.id,
                {
                    previousStatus: previousStatus,
                    newStatus: order_status,
                    webhookTimestamp: webhookData.timestamp,
                    isOnHold: is_on_hold_order,
                    notificationId: webhookData.tts_notification_id
                }
            );
        }

        // Handle specific status changes for business logic
        await handleSpecificStatusChanges(existingOrder.id, order_status ?? '', webhookData, credentials.id);

    } catch (error) {
        console.error('Error handling order status change:', error);
        
        // Create error notification
        try {
            await NotificationService.createNotification({
                type: NotificationType.WEBHOOK_ERROR,
                title: 'Webhook Processing Failed',
                message: `Failed to process order status change for order ${webhookData.data.order_id}: ${error instanceof Error ? error.message : String(error)}`,
                userId: 'system', // You might want to create a system user or get admin users
                data: {
                    webhookType: 'ORDER_STATUS_CHANGE',
                    orderId: webhookData.data.order_id,
                    shopId: webhookData.shop_id,
                    error: (error as Error).message,
                    timestamp: webhookData.timestamp
                }
            });
        } catch (notificationError) {
            console.error('Failed to create error notification:', notificationError);
        }
        
        throw error;
    }
}

async function handleSpecificStatusChanges(orderId: string, newStatus: string, webhookData: TikTokWebhookData, shopId: string) {
    // Handle specific business logic for different status changes
    switch (newStatus.toLowerCase()) {
        case 'awaiting_shipment':
            console.log(`Order ${webhookData.data.order_id} is awaiting shipment`);
            // Create specific notification for awaiting shipment
            await NotificationService.createNotification({
                type: NotificationType.ORDER_STATUS_CHANGE,
                title: '📦 Order Ready to Ship',
                message: `Order ${webhookData.data.order_id} is awaiting shipment and ready for processing`,
                userId: shopId, // Will be distributed to shop users
                orderId: orderId,
                shopId: shopId,
                data: {
                    priority: 'high',
                    actionRequired: true,
                    statusChange: 'awaiting_shipment'
                }
            });
            break;

        case 'in_transit':
            console.log(`Order ${webhookData.data.order_id} is in transit`);
            // Create tracking notification
            await NotificationService.createNotification({
                type: NotificationType.ORDER_STATUS_CHANGE,
                title: '🚚 Order In Transit',
                message: `Order ${webhookData.data.order_id} is now in transit to the customer`,
                userId: shopId,
                orderId: orderId,
                shopId: shopId,
                data: {
                    trackingAvailable: true,
                    statusChange: 'in_transit'
                }
            });
            break;

        case 'delivered':
            console.log(`Order ${webhookData.data.order_id} has been delivered`);
            try {
                const order = await prisma.order.update({
                    where: { id: orderId },
                    data: { customStatus: 'DELIVERED' },
                    include: { payment: true, shop: true }
                });
                
                // Create delivered notification with celebration
                await NotificationService.createOrderNotification(
                    NotificationType.ORDER_DELIVERED,
                    order,
                    shopId,
                    {
                        celebratory: true,
                        completionStatus: 'DELIVERED',
                        deliveryConfirmed: true
                    }
                );
                
                console.log(`Auto-updated customStatus to DELIVERED for order ${webhookData.data.order_id}`);
            } catch (error) {
                console.error('Error updating customStatus:', error);
            }
            break;

        case 'cancelled':
            console.log(`Order ${webhookData.data.order_id} has been cancelled`);
            // Create cancellation alert
            await NotificationService.createNotification({
                type: NotificationType.ORDER_CANCELLED,
                title: '❌ Order Cancelled',
                message: `Order ${webhookData.data.order_id} has been cancelled`,
                userId: shopId,
                orderId: orderId,
                shopId: shopId,
                data: {
                    priority: 'high',
                    refundRequired: true,
                    statusChange: 'cancelled'
                }
            });
            break;

        case 'unpaid':
            console.log(`Order ${webhookData.data.order_id} is unpaid`);
            // Create payment reminder notification
            await NotificationService.createNotification({
                type: NotificationType.ORDER_STATUS_CHANGE,
                title: '💳 Payment Pending',
                message: `Order ${webhookData.data.order_id} is awaiting payment from customer`,
                userId: shopId,
                orderId: orderId,
                shopId: shopId,
                data: {
                    paymentPending: true,
                    statusChange: 'unpaid',
                    followUpRequired: true
                }
            });
            break;

        default:
            console.log(`Order ${webhookData.data.order_id} status changed to ${newStatus}`);
            // Create generic status change notification
            await NotificationService.createNotification({
                type: NotificationType.ORDER_STATUS_CHANGE,
                title: 'Order Status Updated',
                message: `Order ${webhookData.data.order_id} status changed to ${newStatus}`,
                userId: shopId,
                orderId: orderId,
                shopId: shopId,
                data: {
                    statusChange: newStatus,
                    generic: true
                }
            });
    }
}

async function handleCancellationStatusChange(webhookData: TikTokWebhookData) {
    try {
        const { shop_id, data } = webhookData;
        const { 
            order_id, 
            cancellation_id, 
            cancellation_status,
            cancel_reason,
            cancel_user,
            cancel_user_id,
            cancel_time,
            line_items,
            update_time 
        } = data;

        console.log(`Processing cancellation status change: ${order_id} -> ${cancellation_status} (ID: ${cancellation_id})`);

        // Get shop credentials
        const credentials = await prisma.shopAuthorization.findUnique({
            where: { shopId: shop_id },
            include: { app: true }
        });

        if (!credentials) {
            // Create system alert for missing shop
            await NotificationService.createNotification({
                type: NotificationType.SYSTEM_ALERT,
                title: 'Cancellation Webhook Error',
                message: `Cancellation webhook received for unknown shop ${shop_id}`,
                userId: 'system',
                data: {
                    webhookType: 'CANCELLATION_STATUS_CHANGE',
                    orderId: order_id,
                    cancellationId: cancellation_id,
                    shopId: shop_id
                }
            });
            return;
        }

        // Find the order in our database
        const existingOrder = await prisma.order.findFirst({
            where: {
                orderId: order_id,
                shopId: credentials.id
            }
        });

        if (!existingOrder) {
            console.log(`Order ${order_id} not found in database, will sync from API first`);
            
            // Create notification about missing order
            await NotificationService.createNotification({
                type: NotificationType.SYSTEM_ALERT,
                title: 'Order Sync Required',
                message: `Cancellation received for order ${order_id} not found locally, syncing from API`,
                userId: credentials.id,
                shopId: credentials.id,
                data: {
                    orderId: order_id,
                    cancellationId: cancellation_id,
                    syncRequired: true
                }
            });

            await syncOrderFromTikTok(credentials, order_id);
            return;
        }

        // Update order with cancellation information
        const updateData: any = {
            updateTime: update_time,
        };

        // Handle cancellation data
        let channelData = {};
        try {
            channelData = JSON.parse(existingOrder.channelData || '{}');
        } catch (error) {
            console.warn('Failed to parse existing channelData');
        }

        channelData = {
            ...channelData,
            lastWebhookUpdate: Date.now(),
            lastWebhookTimestamp: webhookData.timestamp,
            notificationId: webhookData.tts_notification_id,
            // Cancellation specific data
            cancellationId: cancellation_id,
            cancellationStatus: cancellation_status,
            cancelReason: cancel_reason,
            cancelUser: cancel_user,
            cancelUserId: cancel_user_id,
            cancelTime: cancel_time,
            cancelledLineItems: line_items
        };
        updateData.channelData = JSON.stringify(channelData);

        // Update order status if fully cancelled
        if (cancellation_status === 'CANCELLED') {
            updateData.status = 'CANCELLED';
        }

        // Update the order in database
        const updatedOrder = await prisma.order.update({
            where: { id: existingOrder.id },
            data: updateData,
            include: { payment: true, shop: true }
        });

        console.log(`Successfully updated order ${order_id} with cancellation status ${cancellation_status}`);

        // Create cancellation notification
        await NotificationService.createNotification({
            type: NotificationType.ORDER_CANCELLED,
            title: 'Order Cancellation Update',
            message: `Order ${order_id} cancellation status: ${cancellation_status}`,
            userId: credentials.id,
            orderId: existingOrder.id,
            shopId: credentials.id,
            data: {
                cancellationId: cancellation_id,
                cancellationStatus: cancellation_status,
                cancelReason: cancel_reason,
                cancelUser: cancel_user,
                cancelTime: cancel_time,
                affectedItems: line_items?.length || 0,
                webhookTimestamp: webhookData.timestamp
            }
        });

        // Handle specific cancellation status changes
        await handleSpecificCancellationStatusChanges(existingOrder.id, cancellation_status ?? "", webhookData, credentials.id);

    } catch (error) {
        console.error('Error handling cancellation status change:', error);
        
        // Create error notification
        try {
            await NotificationService.createNotification({
                type: NotificationType.WEBHOOK_ERROR,
                title: 'Cancellation Processing Failed',
                message: `Failed to process cancellation for order ${webhookData.data.order_id}: ${error instanceof Error ? error.message : String(error)}`,
                userId: 'system',
                data: {
                    webhookType: 'CANCELLATION_STATUS_CHANGE',
                    orderId: webhookData.data.order_id,
                    cancellationId: webhookData.data.cancellation_id,
                    shopId: webhookData.shop_id,
                    error: error instanceof Error ? error.message : String(error)
                }
            });
        } catch (notificationError) {
            console.error('Failed to create error notification:', notificationError);
        }
        
        throw error;
    }
}

async function handleSpecificCancellationStatusChanges(orderId: string, cancellationStatus: string, webhookData: TikTokWebhookData, shopId: string) {
    const { data } = webhookData;
    
    switch (cancellationStatus?.toLowerCase()) {
        case 'buyer_cancelled':
            console.log(`Order ${data.order_id} was cancelled by buyer`);
            await NotificationService.createNotification({
                type: NotificationType.ORDER_CANCELLED,
                title: '🛑 Buyer Cancelled Order',
                message: `Order ${data.order_id} was cancelled by the buyer. Reason: ${data.cancel_reason}`,
                userId: shopId,
                orderId: orderId,
                shopId: shopId,
                data: {
                    priority: 'high',
                    cancelledBy: 'buyer',
                    reason: data.cancel_reason,
                    actionRequired: 'refund_processing'
                }
            });
            break;

        case 'seller_cancelled':
            console.log(`Order ${data.order_id} was cancelled by seller`);
            await NotificationService.createNotification({
                type: NotificationType.ORDER_CANCELLED,
                title: '📋 Seller Cancelled Order',
                message: `Order ${data.order_id} was cancelled by seller. Reason: ${data.cancel_reason}`,
                userId: shopId,
                orderId: orderId,
                shopId: shopId,
                data: {
                    priority: 'medium',
                    cancelledBy: 'seller',
                    reason: data.cancel_reason,
                    performanceImpact: true
                }
            });
            break;

        case 'system_cancelled':
            console.log(`Order ${data.order_id} was cancelled by system`);
            await NotificationService.createNotification({
                type: NotificationType.SYSTEM_ALERT,
                title: '⚠️ System Cancelled Order',
                message: `Order ${data.order_id} was automatically cancelled by the system. Reason: ${data.cancel_reason}`,
                userId: shopId,
                orderId: orderId,
                shopId: shopId,
                data: {
                    priority: 'high',
                    cancelledBy: 'system',
                    reason: data.cancel_reason,
                    reviewRequired: true
                }
            });
            break;

        case 'cancelled':
            console.log(`Order ${data.order_id} cancellation completed`);
            try {
                const order = await prisma.order.update({
                    where: { id: orderId },
                    data: { 
                        customStatus: null,
                        status: 'CANCELLED'
                    },
                    include: { payment: true, shop: true }
                });
                
                // Create final cancellation notification
                await NotificationService.createOrderNotification(
                    NotificationType.ORDER_CANCELLED,
                    order,
                    shopId,
                    {
                        cancellationReason: data.cancel_reason,
                        cancelledBy: data.cancel_user,
                        cancellationId: data.cancellation_id,
                        final: true,
                        refundStatus: 'pending'
                    }
                );
                
                console.log(`Order ${data.order_id} marked as fully cancelled`);
            } catch (error) {
                console.error('Error updating order status to cancelled:', error);
            }
            break;

        case 'partial_cancelled':
            console.log(`Order ${data.order_id} was partially cancelled`);
            await NotificationService.createNotification({
                type: NotificationType.ORDER_CANCELLED,
                title: '🔄 Partial Order Cancellation',
                message: `Order ${data.order_id} was partially cancelled (${data.line_items?.length || 0} items)`,
                userId: shopId,
                orderId: orderId,
                shopId: shopId,
                data: {
                    priority: 'medium',
                    partial: true,
                    cancelledItems: data.line_items?.length || 0,
                    partialRefundRequired: true,
                    inventoryUpdateRequired: true
                }
            });
            break;

        default:
            console.log(`Unhandled cancellation status: ${cancellationStatus} for order ${data.order_id}`);
            await NotificationService.createNotification({
                type: NotificationType.SYSTEM_ALERT,
                title: 'Unknown Cancellation Status',
                message: `Order ${data.order_id} received unknown cancellation status: ${cancellationStatus}`,
                userId: shopId,
                orderId: orderId,
                shopId: shopId,
                data: {
                    unknownStatus: cancellationStatus,
                    reviewRequired: true
                }
            });
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

            // Create notification for new order - Enhanced with more details
            await NotificationService.createOrderNotification(
                NotificationType.NEW_ORDER,
                {
                    id: order.id,
                    orderId: orderData.id,
                    buyerEmail: orderData.buyerEmail,
                    totalAmount: orderData.payment?.totalAmount,
                    currency: orderData.payment?.currency,
                    status: orderData.status
                },
                shopId,
                {
                    syncedFromWebhook: true,
                    orderType: orderData.orderType,
                    fulfillmentType: orderData.fulfillmentType,
                    itemCount: orderData.lineItems?.length || 0,
                    priority: 'high', // New orders are high priority
                    actionRequired: true
                }
            );

            // Create additional notification if order has special conditions
            if (orderData.isOnHoldOrder) {
                await NotificationService.createNotification({
                    type: NotificationType.SYSTEM_ALERT,
                    title: '⏸️ Order On Hold',
                    message: `New order ${orderData.id} is currently on hold and requires attention`,
                    userId: shopId,
                    orderId: order.id,
                    shopId: shopId,
                    data: {
                        onHold: true,
                        priority: 'urgent',
                        actionRequired: true,
                        reviewRequired: true
                    }
                });
            }

            console.log(`Successfully inserted order ${orderData.id} with ${orderData.lineItems?.length || 0} line items`);
        });

    } catch (error) {
        console.error('Error inserting order with associations:', error);
        
        // Create error notification for failed order sync
        try {
            await NotificationService.createNotification({
                type: NotificationType.WEBHOOK_ERROR,
                title: 'Order Sync Failed',
                message: `Failed to sync order ${orderData.id} from webhook: ${error instanceof Error ? error.message : String(error)}`,
                userId: shopId,
                shopId: shopId,
                data: {
                    orderId: orderData.id,
                    error: error instanceof Error ? error.message : String(error),
                    syncFailed: true,
                    retryRequired: true
                }
            });
        } catch (notificationError) {
            console.error('Failed to create error notification:', notificationError);
        }
        
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
