import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import crypto from 'crypto';

const prisma = new PrismaClient();

interface TikTokWebhookData {
    type: string;
    shop_id: string;
    data: {
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
    timestamp: number;
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.text();
        const signature = request.headers.get('x-tts-signature');
        const timestamp = request.headers.get('x-tts-timestamp');

        console.log('TikTok Webhook received:', {
            signature: signature ? 'present' : 'missing',
            timestamp,
            bodyLength: body.length,
        });

        // Parse the webhook data
        let webhookData: TikTokWebhookData;
        try {
            webhookData = JSON.parse(body);
        } catch (error) {
            console.error('Invalid JSON in webhook body:', error);
            return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
        }

        console.log('Webhook data:', JSON.stringify(webhookData, null, 2));

        // Verify webhook signature if signature is provided
        if (signature) {
            const isValid = await verifyWebhookSignature(body, signature, webhookData.shop_id);
            if (!isValid) {
                console.error('Invalid webhook signature');
                return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
            }
        }

        // Handle different webhook types
        switch (webhookData.type) {
            case 'ORDER_STATUS_CHANGE':
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
        });

    } catch (error) {
        console.error('Error processing TikTok webhook:', error);
        return NextResponse.json({ 
            code: 1, 
            message: 'Internal server error',
            data: null 
        }, { status: 500 });
    }
}

async function verifyWebhookSignature(body: string, signature: string, shopId: string): Promise<boolean> {
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
        // The signature is HMAC-SHA256 of the request body using app secret
        const expectedSignature = crypto
            .createHmac('sha256', appSecret)
            .update(body)
            .digest('hex');

        return signature === expectedSignature;
    } catch (error) {
        console.error('Error verifying webhook signature:', error);
        return false;
    }
}

async function handleOrderStatusChange(webhookData: TikTokWebhookData) {
    try {
        const { shop_id, data } = webhookData;
        const { order_id, order_status, update_time, fulfillment_orders, cancel_reason, cancel_user } = data;

        console.log(`Processing order status change: ${order_id} -> ${order_status}`);

        // Find the order in our database
        const existingOrder = await prisma.order.findFirst({
            where: {
                orderId: order_id,
                shopId: shop_id
            }
        });

        if (!existingOrder) {
            console.log(`Order ${order_id} not found in database, will sync from API`);
            // Optionally trigger a sync for this specific order
            await syncOrderFromTikTok(shop_id, order_id);
            return;
        }

        // Update order status and other relevant fields
        const updateData: any = {
            status: order_status,
            updateTime: update_time,
        };

        // Handle fulfillment information
        if (fulfillment_orders && fulfillment_orders.length > 0) {
            const fulfillmentData = fulfillment_orders[0]; // Take first fulfillment order
            if (fulfillmentData.tracking_number) {
                updateData.trackingNumber = fulfillmentData.tracking_number;
            }
            
            // Update channel data with fulfillment information
            let channelData = {};
            try {
                channelData = JSON.parse(existingOrder.channelData || '{}');
            } catch (error) {
                console.warn('Failed to parse existing channelData');
            }

            channelData = {
                ...channelData,
                fulfillmentOrders: fulfillment_orders,
                lastWebhookUpdate: Date.now()
            };
            updateData.channelData = JSON.stringify(channelData);
        }

        // Handle cancellation information
        if (cancel_reason || cancel_user) {
            let channelData = {};
            try {
                channelData = JSON.parse(existingOrder.channelData || '{}');
            } catch (error) {
                console.warn('Failed to parse existing channelData');
            }

            channelData = {
                ...channelData,
                cancelReason: cancel_reason,
                cancelUser: cancel_user,
                lastWebhookUpdate: Date.now()
            };
            updateData.channelData = JSON.stringify(channelData);
        }

        // Update the order in database
        await prisma.order.update({
            where: { id: existingOrder.id },
            data: updateData
        });

        console.log(`Successfully updated order ${order_id} status to ${order_status}`);

        // Handle specific status changes
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
            break;
            
        case 'cancelled':
            console.log(`Order ${webhookData.data.order_id} has been cancelled`);
            // Could trigger refund processes, inventory updates, etc.
            break;
            
        default:
            console.log(`Order ${webhookData.data.order_id} status changed to ${newStatus}`);
    }
}

async function syncOrderFromTikTok(shopId: string, orderId: string) {
    try {
        console.log(`Syncing order ${orderId} from TikTok API`);
        
        // Get shop credentials
        const credentials = await prisma.shopAuthorization.findUnique({
            where: { shopId },
            include: { app: true }
        });

        if (!credentials || !credentials.app) {
            console.error('Shop credentials not found for order sync');
            return;
        }

        // Make API call to fetch order details
        // This would use your existing TikTok API client
        // const orderDetails = await fetchOrderFromTikTokAPI(credentials, orderId);
        // await saveOrderToDatabase(orderDetails);
        
        console.log(`Order ${orderId} sync completed`);
    } catch (error) {
        console.error(`Error syncing order ${orderId}:`, error);
    }
}

// GET endpoint for webhook verification (if TikTok requires it)
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const challenge = searchParams.get('hub.challenge');
    const verify_token = searchParams.get('hub.verify_token');
    
    // Verify the token matches your configured verification token
    const expectedToken = process.env.TIKTOK_WEBHOOK_VERIFY_TOKEN || 'your_verify_token';
    
    if (verify_token === expectedToken && challenge) {
        return new Response(challenge, { status: 200 });
    }
    
    return NextResponse.json({ error: 'Invalid verification' }, { status: 403 });
}
