import { NotificationType, PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { TikTokWebhookData } from "../../tiktok/webhook/route";
import { NotificationService } from "@/lib/notification-service";
import { syncOrderById } from "@/lib/tiktok-order-sync";
import { syncTikTokProductById } from "@/lib/tiktok-product-sync";

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
                    // Deduplicate using order_id if present else product_id, plus cancellation id when exists
                    const dataAny: any = webhookData?.data || {};
                    const logicalOrderOrProductId = dataAny.order_id ?? dataAny.product_id ?? '';
                    const dedupKey = `${webhookData?.shop_id ?? ''}:${webhookData?.type ?? ''}:${logicalOrderOrProductId}:${webhookData?.data?.cancellation_id ?? ''}`;

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
                        case 5:
                            await handleSyncProductById(webhookData);
                            break;
                        case 15:
                            await handleSyncProductById(webhookData);
                            break;
                        case 16:
                            await handleSyncProductById(webhookData);
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

                await handleSpecificStatusChanges(
                    updatedOrder.id,
                    order_status ?? '',
                    webhookData,
                    credentials.id,
                    credentials.orgId,
                    updatedOrder.createTime ? new Date(updatedOrder.createTime * 1000).setHours(0, 0, 0, 0) / 1000 : Date.now() / 1000
                );
            }
        } catch (syncError) {
            console.error(`Failed to sync order ${order_id} from webhook:`, syncError);
        }

    } catch (error) {
        console.error('Error handling order status change:', error);
        throw error;
    }
}

async function handleSpecificStatusChanges(orderId: string, newStatus: string, webhookData: TikTokWebhookData, shopId: string, orgId: string, createTime: number) {
    // Handle specific business logic for different status changes
    switch (newStatus.toLowerCase()) {
        case 'awaiting_shipment':
            console.log(`Order ${webhookData.data.order_id} is awaiting shipment`);

            // Create specific notification for awaiting shipment
            await NotificationService.createNotification({
                type: NotificationType.ORDER_STATUS_CHANGE,
                title: '📦 Đơn hàng sẵn sàng giao',
                message: `Đơn hàng ${webhookData.data.order_id} đang chờ giao và sẵn sàng xử lý`,
                userId: shopId, // Will be distributed to shop users
                orderId: orderId,
                shopId: shopId,
                orgId,
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
                title: '🚚 Đơn hàng đang vận chuyển',
                message: `Đơn hàng ${webhookData.data.order_id} đang được vận chuyển tới khách hàng`,
                userId: shopId,
                orderId: orderId,
                shopId: shopId,
                orgId: orgId,
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
                    orgId,
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
                title: '❌ Đơn hàng đã hủy',
                message: `Đơn hàng ${webhookData.data.order_id} đã bị hủy`,
                userId: shopId,
                orderId: orderId,
                shopId: shopId,
                orgId: orgId,
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
                title: '💳 Chờ thanh toán',
                message: `Đơn hàng ${webhookData.data.order_id} đang chờ khách hàng thanh toán`,
                userId: shopId,
                orderId: orderId,
                shopId: shopId,
                orgId: orgId,
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
                title: 'Cập nhật trạng thái đơn hàng',
                message: `Trạng thái đơn hàng ${webhookData.data.order_id} đã thay đổi thành ${newStatus}`,
                userId: shopId,
                orderId: orderId,
                shopId: shopId,
                orgId: orgId,
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
                title: 'Cần đồng bộ đơn hàng',
                message: `Nhận thông tin hủy cho đơn ${order_id} chưa có trong hệ thống, đang đồng bộ từ API`,
                userId: credentials.id,
                shopId: credentials.id,
                orgId: credentials.orgId,
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
            title: 'Cập nhật hủy đơn hàng',
            message: `Trạng thái hủy của đơn ${order_id}: ${cancellation_status}`,
            userId: credentials.id,
            orderId: existingOrder.id,
            shopId: credentials.id,
            orgId: credentials.orgId,
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
        await handleSpecificCancellationStatusChanges(existingOrder.id, cancellation_status ?? "", webhookData, credentials.id, credentials.orgId);

    } catch (error) {
        console.error('Error handling cancellation status change:', error);
        throw error;
    }
}

async function handleSpecificCancellationStatusChanges(orderId: string, cancellationStatus: string, webhookData: TikTokWebhookData, shopId: string, orgId: string) {
    const { data } = webhookData;

    switch (cancellationStatus?.toLowerCase()) {
        case 'buyer_cancelled':
            console.log(`Order ${data.order_id} was cancelled by buyer`);
            await NotificationService.createNotification({
                type: NotificationType.ORDER_CANCELLED,
                title: '🛑 Người mua hủy đơn',
                message: `Đơn ${data.order_id} đã bị người mua hủy. Lý do: ${data.cancel_reason}`,
                userId: shopId,
                orderId: orderId,
                shopId: shopId,
                orgId: orgId,
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
                title: '📋 Người bán hủy đơn',
                message: `Đơn ${data.order_id} đã bị người bán hủy. Lý do: ${data.cancel_reason}`,
                userId: shopId,
                orderId: orderId,
                shopId: shopId,
                orgId: orgId,
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
                title: '⚠️ Hệ thống hủy đơn',
                message: `Đơn ${data.order_id} đã bị hệ thống tự động hủy. Lý do: ${data.cancel_reason}`,
                userId: shopId,
                orderId: orderId,
                shopId: shopId,
                orgId: orgId,
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
                    orgId,
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
                title: '🔄 Hủy đơn hàng một phần',
                message: `Đơn ${data.order_id} bị hủy một phần (${data.line_items?.length || 0} sản phẩm)`,
                userId: shopId,
                orderId: orderId,
                shopId: shopId,
                orgId: orgId,
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
                title: 'Trạng thái hủy không xác định',
                message: `Đơn ${data.order_id} nhận trạng thái hủy không xác định: ${cancellationStatus}`,
                userId: shopId,
                orderId: orderId,
                shopId: shopId,
                orgId: orgId,
                data: {
                    unknownStatus: cancellationStatus,
                    reviewRequired: true
                }
            });
    }
}

// Handle product change webhook (type 15)
async function handleSyncProductById(webhookData: TikTokWebhookData) {
    try {
        const { shop_id, data } = webhookData as any;
        if (!data?.product_id) {
            console.warn('Product webhook missing product_id');
            return;
        }

        console.log(`Processing product change webhook product_id=${data.product_id}`);

        // Attempt sync (force update to capture changes)
        const syncResult = await syncTikTokProductById({
            shopId: shop_id,
            productId: String(data.product_id),
            forceUpdate: true
        });

        if (!syncResult.success) {
            // await NotificationService.createNotification({
            //     type: NotificationType.WEBHOOK_ERROR,
            //     title: 'Đồng bộ sản phẩm thất bại',
            //     message: `Không thể đồng bộ sản phẩm ${data.product_id}: ${syncResult.errors?.join(', ')}`,
            //     userId: 'system',
            //     data: {
            //         webhookType: 'PRODUCT_CHANGE',
            //         productId: data.product_id,
            //         shopId: shop_id,
            //         errors: syncResult.errors
            //     }
            // });
            return;
        }
    } catch (error) {
        console.error('Error handling product sync webhook:', error);
        throw error;
    }
}