import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, Prisma } from "@prisma/client";
import crypto from 'crypto';

const prisma = new PrismaClient();

export interface TikTokWebhookData {
    type: number;
    tts_notification_id: string;
    shop_id: string;
    timestamp: number;
    data: {
        is_on_hold_order?: boolean;
        order_id: string;
        order_status?: string;
        update_time: number;
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

// Optional: allow a bit more time for inline sync on Vercel (adjust as needed)
export const maxDuration = 25;

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

        await prisma.tikTokWebhook.create({
            data: {
                type: webhookData.type,
                ttsNotificationId: webhookData.tts_notification_id,
                shopId: webhookData.shop_id,
                timestamp: webhookData.timestamp,
                verified: true,
                rawBody: body,
                orderId: webhookData.data?.order_id ?? null,
                orderStatus: webhookData.data?.order_status ?? null,
                cancellationId: webhookData.data?.cancellation_id ?? null,
                cancellationStatus: webhookData.data?.cancellation_status ?? null,
                status: 'RECEIVED'
            }
        });

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