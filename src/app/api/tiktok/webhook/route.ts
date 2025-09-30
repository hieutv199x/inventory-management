import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import crypto from 'crypto';
import { prisma } from '../../../../../prisma/client';

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

        let webhookData: TikTokWebhookData;
        try {
            webhookData = JSON.parse(body);
        } catch (error) {
            console.error('Invalid JSON in webhook body:', error);
            return NextResponse.json({ code: 40001, message: 'Invalid JSON format', data: null }, { status: 400 });
        }

        // Lookup shop (for org + signature secret)
        const shop = await prisma.shopAuthorization.findUnique({ where: { shopId: webhookData.shop_id }, include: { app: true } });
        let verified = false;
        if (signature && timestamp && shop?.app?.appSecret) {
            verified = verifySignature(body, signature, shop.app.appSecret, timestamp);
            if (!verified) {
                return NextResponse.json({ code: 40003, message: 'Invalid signature', data: null }, { status: 401 });
            }
        }

        const baseData = {
            type: webhookData.type,
            ttsNotificationId: webhookData.tts_notification_id,
            shopId: webhookData.shop_id,
            timestamp: webhookData.timestamp,
            signature: signature ?? null,
            verified,
            rawBody: body,
            data: webhookData.data as unknown as Prisma.InputJsonValue,
            headers: Object.fromEntries(request.headers) as unknown as Prisma.InputJsonValue,
            orderId: webhookData.data?.order_id ?? null,
            orderStatus: webhookData.data?.order_status ?? null,
            cancellationId: webhookData.data?.cancellation_id ?? null,
            cancellationStatus: webhookData.data?.cancellation_status ?? null,
            status: 'RECEIVED',
            orgId: shop?.orgId
        } as const;

        try {
            await prisma.tikTokWebhook.create({ data: baseData });
        } catch (err: any) {
            // Fallback: raw insert when deployment Mongo does not support transactions (P2010 scenario)
            if (err?.code === 'P2010' && /Transactions are not supported/i.test(err?.message || '')) {
                console.warn('Falling back to raw Mongo insert for TikTokWebhook due to transaction limitation');
                try {
                    // Mongo collection name: model name (TikTokWebhook) unless @@map applied (not present)
                        // Use Mongo insert command via runCommandRaw
                    await (prisma as any).$runCommandRaw({
                        insert: 'TikTokWebhook',
                        documents: [baseData]
                    });
                } catch (rawErr) {
                    console.error('Raw insert fallback failed:', rawErr);
                    throw err; // rethrow original
                }
            } else {
                throw err;
            }
        }

        return NextResponse.json({ code: 0, message: 'success', data: null }, { status: 200 });
    } catch (error) {
        console.error('Error processing TikTok webhook:', error);
        return NextResponse.json({ code: 50000, message: 'Internal server error', data: null }, { status: 500 });
    }
}

function verifySignature(body: string, signature: string, secret: string, timestamp: string): boolean {
  const expected = crypto.createHmac('sha256', secret).update(body + timestamp).digest('hex');
  const ok = signature === expected;
  if (!ok) {
    console.warn('Signature mismatch', { provided: signature, expected });
  }
  return ok;
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