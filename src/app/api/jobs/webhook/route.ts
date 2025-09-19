import { NotificationType, PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { TikTokWebhookData } from "../../tiktok/webhook/route";
import { NotificationService } from "@/lib/notification-service";
import { syncOrderById } from "@/lib/tiktok-order-sync";
import { syncUnsettledTransactions } from "@/lib/tiktok-unsettled-transactions-sync";
import { syncOrderCanSplitOrNot } from "@/lib/tiktok-order-sync-fulfillment-state";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
    try {
        const webhooks = await prisma.tikTokWebhook.findMany({
            orderBy: { createdAt: 'desc' }
        });

        // Dedup set to avoid processing the same logical event multiple times
        const seen = new Set<string>();

        for (const webhook of webhooks) {
            if (webhook.verified) {
                try {
                    // Attempt to parse JSON fields once per webhook
                    let webhookData: TikTokWebhookData;
                    try {
                        webhookData = JSON.parse(webhook.rawBody);
                    } catch (error) {
                        console.error('Invalid JSON in webhook body, skipping:', error);
                        // Skip processing; will be deleted in finally
                        continue;
                    }

                    // Build a stable deduplication key
                    const dedupKey = `${webhookData?.shop_id ?? ''}:${webhookData?.type ?? ''}:${webhookData?.data?.order_id ?? ''}:${webhookData?.data?.cancellation_id ?? ''}`;

                    if (seen.has(dedupKey)) {
                        console.log(`Duplicate webhook detected (key=${dedupKey}), skipping processing`);
                        // Skip processing; will be deleted in finally
                        await prisma.tikTokWebhook.delete({
                            where: { id: webhook.id }
                        });
                        continue;
                    }
                    seen.add(dedupKey);

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

                    await prisma.tikTokWebhook.delete({
                        where: { id: webhook.id }
                    });
                } catch (e) {
                    console.error(`Failed to parse or process data for webhook ID ${webhook.id}:`, e);
                }
            }
        }

        return NextResponse.json(webhooks);
    } catch (error) {
        console.error('Get shops error:', error);
        return NextResponse.json(
            { message: 'Failed to fetch shops' },
            { status: 500 }
        );
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

        // store event data in channelData for reference


        // Store previous status for comparison (if order exists)
        const existingOrder = await prisma.order.findFirst({
            where: {
                orderId: order_id,
                shopId: credentials.id
            },
            select: { status: true, id: true }
        });

        const previousStatus = existingOrder?.status || null;

        // Always sync the order to get latest data including recipient address
        console.log(`Syncing order ${order_id} to get latest data including status change`);

        // Previously this used setTimeout. In Vercel serverless, setTimeout after returning
        // is unreliable because the lambda may freeze. So we do it inline.
        try {
            const syncResult = await syncOrderById(shop_id, order_id, {
                create_notifications: false,
                timeout_seconds: 120
            });
            console.log(`Webhook order sync completed:`, syncResult);

            const updatedOrder = await prisma.order.findFirst({
                where: { orderId: order_id, shopId: credentials.id },
                include: { payment: true, shop: true, recipientAddress: true }
            });

            if (updatedOrder) {
                if (credentials.id) {
                    await NotificationService.createOrderNotification(
                        NotificationType.ORDER_STATUS_CHANGE,
                        updatedOrder,
                        credentials.id,
                        {
                            previousStatus,
                            newStatus: order_status,
                            webhookTimestamp: webhookData.timestamp,
                            isOnHold: is_on_hold_order,
                            notificationId: webhookData.tts_notification_id,
                            syncTriggered: true
                        }
                    );
                }

                if (updatedOrder.canSplitPackages === null) {
                    try {
                        // Sync order attributes
                        await syncOrderCanSplitOrNot(prisma, {
                            shop_id: credentials.shopId,
                            order_ids: [updatedOrder.orderId]
                        });
                    } catch (attributeError) {
                        console.error(`Failed to sync order attributes for order ${updatedOrder.orderId}:`, attributeError);
                    }
                }

                await handleSpecificStatusChanges(
                    updatedOrder.id,
                    order_status ?? '',
                    webhookData,
                    credentials.id,
                    updatedOrder.createTime ? new Date(updatedOrder.createTime * 1000).setHours(0, 0, 0, 0) / 1000 : Date.now() / 1000
                );
            }
        } catch (syncError) {
            console.error(`Failed to sync order ${order_id} from webhook:`, syncError);
            await NotificationService.createNotification({
                type: NotificationType.WEBHOOK_ERROR,
                title: 'Order Sync Failed',
                message: `Failed to sync order ${order_id} after status change: ${syncError instanceof Error ? syncError.message : String(syncError)}`,
                userId: 'system',
                data: {
                    webhookType: 'ORDER_STATUS_CHANGE',
                    orderId: order_id,
                    shopId: shop_id,
                    error: syncError instanceof Error ? syncError.message : String(syncError),
                    timestamp: webhookData.timestamp
                }
            });
        }

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

async function handleSpecificStatusChanges(orderId: string, newStatus: string, webhookData: TikTokWebhookData, shopId: string, createTime: number) {
    // Handle specific business logic for different status changes
    switch (newStatus.toLowerCase()) {
        case 'awaiting_shipment':
            console.log(`Order ${webhookData.data.order_id} is awaiting shipment`);

            try {
                // Sync unsettled transactions to ensure payment status is up to date
                await syncUnsettledTransactions(prisma, {
                    shop_id: shopId,
                    search_time_ge: createTime,
                    search_time_lt: Math.floor(Date.now() / 1000),
                    page_size: 10
                });
            } catch (syncError) {
                console.error(`Failed to sync unsettled transactions for order ${orderId}:`, syncError);
            }

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

            // Use the utility function
            try {
                const syncResult = await syncOrderById(shop_id, order_id, {
                    create_notifications: false,
                    timeout_seconds: 60
                });
                console.log(`Webhook cancellation sync completed:`, syncResult);
            } catch (syncError) {
                console.error(`Failed to sync order ${order_id} from cancellation webhook:`, syncError);
            }
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