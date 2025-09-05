import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

// TikTok Shop webhook event types
interface WebhookEvent {
    type: string;
    shop_id: string;
    timestamp: number;
    data: any;
}

// Verify TikTok Shop webhook signature
function verifySignature(body: string, signature: string, secret: string): boolean {
    try {
        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(body)
            .digest('hex');

        return crypto.timingSafeEqual(
            Buffer.from(signature, 'hex'),
            Buffer.from(expectedSignature, 'hex')
        );
    } catch (error) {
        console.error('Signature verification error:', error);
        return false;
    }
}

// Handle order events
async function handleOrderEvent(event: WebhookEvent) {
    try {
        const { shop_id, data } = event;

        console.log(`Processing order event for shop ${shop_id}:`, data);

        // Find the shop
        const shop = await prisma.shopAuthorization.findUnique({
            where: { shopId: shop_id }
        });

        if (!shop) {
            console.warn(`Shop ${shop_id} not found in database`);
            return;
        }

        // Process different order event types
        switch (event.type) {
            case 'ORDER_STATUS_CHANGE':
                await handleOrderStatusChange(shop.id, data);
                break;
            case 'ORDER_PAID':
                await handleOrderPaid(shop.id, data);
                break;
            case 'ORDER_CANCELLED':
                await handleOrderCancelled(shop.id, data);
                break;
            case 'ORDER_COMPLETED':
                await handleOrderCompleted(shop.id, data);
                break;
            default:
                console.log(`Unhandled order event type: ${event.type}`);
        }
    } catch (error) {
        console.error('Error handling order event:', error);
        throw error;
    }
}

// Handle product events
async function handleProductEvent(event: WebhookEvent) {
    try {
        const { shop_id, data } = event;

        console.log(`Processing product event for shop ${shop_id}:`, data);

        // Find the shop
        const shop = await prisma.shopAuthorization.findUnique({
            where: { shopId: shop_id }
        });

        if (!shop) {
            console.warn(`Shop ${shop_id} not found in database`);
            return;
        }

        // Process different product event types
        switch (event.type) {
            case 'PRODUCT_STATUS_CHANGE':
                await handleProductStatusChange(shop.id, data);
                break;
            case 'PRODUCT_UPDATE':
                await handleProductUpdate(shop.id, data);
                break;
            case 'PRODUCT_INVENTORY_UPDATE':
                await handleInventoryUpdate(shop.id, data);
                break;
            default:
                console.log(`Unhandled product event type: ${event.type}`);
        }
    } catch (error) {
        console.error('Error handling product event:', error);
        throw error;
    }
}

// Order event handlers
async function handleOrderStatusChange(shopId: string, orderData: any) {
    try {
        const existingOrder = await prisma.order.findUnique({
            where: { orderId: orderData.order_id }
        });

        if (existingOrder) {
            await prisma.order.update({
                where: { orderId: orderData.order_id },
                data: {
                    status: orderData.status,
                    updateTime: orderData.update_time || Math.floor(Date.now() / 1000),
                    channelData: JSON.stringify(orderData)
                }
            });
            console.log(`Updated order ${orderData.order_id} status to ${orderData.status}`);
        } else {
            console.log(`Order ${orderData.order_id} not found, may need to sync from API`);
        }
    } catch (error) {
        console.error('Error updating order status:', error);
        throw error;
    }
}

async function handleOrderPaid(shopId: string, orderData: any) {
    try {
        await prisma.order.updateMany({
            where: {
                orderId: orderData.order_id,
                shopId: shopId
            },
            data: {
                status: 'PAID',
                updateTime: orderData.update_time || Math.floor(Date.now() / 1000),
                channelData: JSON.stringify(orderData)
            }
        });
        console.log(`Order ${orderData.order_id} marked as paid`);
    } catch (error) {
        console.error('Error handling order paid event:', error);
        throw error;
    }
}

async function handleOrderCancelled(shopId: string, orderData: any) {
    try {
        await prisma.order.updateMany({
            where: {
                orderId: orderData.order_id,
                shopId: shopId
            },
            data: {
                status: 'CANCELLED',
                updateTime: orderData.update_time || Math.floor(Date.now() / 1000),
                channelData: JSON.stringify(orderData)
            }
        });
        console.log(`Order ${orderData.order_id} cancelled`);
    } catch (error) {
        console.error('Error handling order cancelled event:', error);
        throw error;
    }
}

async function handleOrderCompleted(shopId: string, orderData: any) {
    try {
        await prisma.order.updateMany({
            where: {
                orderId: orderData.order_id,
                shopId: shopId
            },
            data: {
                status: 'COMPLETED',
                updateTime: orderData.update_time || Math.floor(Date.now() / 1000),
                channelData: JSON.stringify(orderData)
            }
        });
        console.log(`Order ${orderData.order_id} completed`);
    } catch (error) {
        console.error('Error handling order completed event:', error);
        throw error;
    }
}

// Product event handlers
async function handleProductStatusChange(shopId: string, productData: any) {
    try {
        await prisma.product.updateMany({
            where: {
                productId: productData.product_id,
                shopId: shopId
            },
            data: {
                status: productData.status,
                channelData: JSON.stringify(productData)
            }
        });
        console.log(`Product ${productData.product_id} status changed to ${productData.status}`);
    } catch (error) {
        console.error('Error updating product status:', error);
        throw error;
    }
}

async function handleProductUpdate(shopId: string, productData: any) {
    try {
        const existingProduct = await prisma.product.findFirst({
            where: {
                productId: productData.product_id,
                shopId: shopId
            }
        });

        if (existingProduct) {
            await prisma.product.update({
                where: { id: existingProduct.id },
                data: {
                    title: productData.title || existingProduct.title,
                    description: productData.description || existingProduct.description,
                    status: productData.status || existingProduct.status,
                    channelData: JSON.stringify(productData)
                }
            });
            console.log(`Product ${productData.product_id} updated`);
        }
    } catch (error) {
        console.error('Error updating product:', error);
        throw error;
    }
}

async function handleInventoryUpdate(shopId: string, inventoryData: any) {
    try {
        // Update inventory for specific SKU using ProductSku model
        await prisma.sku.updateMany({
            where: {
                skuId: inventoryData.sku_id,
                product: {
                    shopId: shopId
                }
            },
            data: {
                channelData: JSON.stringify(inventoryData)
            }
        });
        
        // If inventory model exists separately, update it as well
        if (inventoryData.quantity !== undefined) {
            await prisma.inventory.upsert({
                where: {
                    skuId_warehouseId: {
                        skuId: inventoryData.sku_id,
                        warehouseId: inventoryData.warehouse_id
                    }
                },
                update: {
                    quantity: inventoryData.quantity,
                    warehouseId: inventoryData.warehouse_id,
                    channelData: JSON.stringify(inventoryData)
                },
                create: {
                    skuId: inventoryData.sku_id,
                    quantity: inventoryData.quantity,
                    warehouseId: inventoryData.warehouse_id,
                    channelData: JSON.stringify(inventoryData)
                }
            });
        }
        
        console.log(`Inventory updated for SKU ${inventoryData.sku_id}`);
    } catch (error) {
        console.error('Error updating inventory:', error);
        throw error;
    }
}

// Log webhook event
async function logWebhookEvent(event: WebhookEvent, status: 'success' | 'error', error?: string) {
    try {
        // Create a webhook log entry (you may want to create a WebhookLog model)
        console.log(`Webhook event logged:`, {
            type: event.type,
            shop_id: event.shop_id,
            timestamp: event.timestamp,
            status,
            error
        });

        // Optionally store in database for audit purposes
        // await prisma.webhookLog.create({...})
    } catch (logError) {
        console.error('Error logging webhook event:', logError);
    }
}

export async function POST(req: NextRequest) {
    try {
        // Get raw body for signature verification
        const body = await req.text();
        const signature = req.headers.get('x-tts-signature') || '';
        const timestamp = req.headers.get('x-tts-timestamp') || '';

        // Verify timestamp (prevent replay attacks)
        const currentTime = Math.floor(Date.now() / 1000);
        const requestTime = parseInt(timestamp);
        if (Math.abs(currentTime - requestTime) > 300) { // 5 minutes
            return NextResponse.json(
                { error: 'Request timestamp too old' },
                { status: 400 }
            );
        }

        // Get webhook secret from environment
        const webhookSecret = process.env.TIKTOK_WEBHOOK_SECRET;
        if (!webhookSecret) {
            console.error('TIKTOK_WEBHOOK_SECRET not configured');
            return NextResponse.json(
                { error: 'Webhook secret not configured' },
                { status: 500 }
            );
        }

        // Verify signature
        if (!verifySignature(body, signature, webhookSecret)) {
            console.error('Invalid webhook signature');
            return NextResponse.json(
                { error: 'Invalid signature' },
                { status: 401 }
            );
        }

        // Parse the webhook event
        const event: WebhookEvent = JSON.parse(body);

        console.log('Received TikTok Shop webhook:', {
            type: event.type,
            shop_id: event.shop_id,
            timestamp: event.timestamp
        });

        // Route event to appropriate handler
        try {
            if (event.type.startsWith('ORDER_')) {
                await handleOrderEvent(event);
            } else if (event.type.startsWith('PRODUCT_')) {
                await handleProductEvent(event);
            } else {
                console.log(`Unhandled webhook event type: ${event.type}`);
            }

            await logWebhookEvent(event, 'success');

            // Return success response
            return NextResponse.json({
                message: 'Webhook processed successfully',
                event_type: event.type,
                timestamp: event.timestamp
            });

        } catch (processingError) {
            console.error('Error processing webhook event:', processingError);
            await logWebhookEvent(event, 'error', processingError instanceof Error ? processingError.message : 'Unknown error');

            // Return error but with 200 status to prevent TikTok from retrying
            return NextResponse.json({
                message: 'Webhook received but processing failed',
                error: processingError instanceof Error ? processingError.message : 'Unknown error'
            });
        }

    } catch (error) {
        console.error('Webhook handler error:', error);

        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}

// Handle GET request for webhook verification
export async function GET(req: NextRequest) {
    // TikTok Shop webhook verification
    const { searchParams } = new URL(req.url);
    const challenge = searchParams.get('challenge');

    if (challenge) {
        console.log('TikTok Shop webhook verification challenge received');
        return new NextResponse(challenge, {
            status: 200,
            headers: { 'Content-Type': 'text/plain' }
        });
    }

    return NextResponse.json(
        { message: 'TikTok Shop Webhook Endpoint' },
        { status: 200 }
    );
}
