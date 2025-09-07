import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import {
    TikTokShopNodeApiClient,
} from "@/nodejs_sdk";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
    try {
        const shop_id = req.nextUrl.searchParams.get("shop_id");

        if (!shop_id ) {
            return NextResponse.json(
                { error: "Missing required fields: shop_id" },
                { status: 400 }
            );
        }

        // Get shop and app info using unified schema
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

        // Ensure this is a TikTok shop
        if (credentials.app?.channel !== 'TIKTOK') {
            return NextResponse.json({ error: "Not a TikTok shop" }, { status: 400 });
        }

        const app_key = credentials.app.appKey;
        const app_secret = credentials.app.appSecret;
        const baseUrl = process.env.TIKTOK_BASE_URL;

        // Extract shopCipher from channelData
        let shopCipher: string | undefined = credentials.shopCipher ?? undefined; // Legacy field
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
        
        const result = await client.api.EventV202309Api.WebhooksGet(credentials.accessToken, "application/json", shopCipher);
        console.log('response: ', JSON.stringify(result, null, 2));

        return NextResponse.json(result);
    } catch (err: any) {
        console.error("Error getting orders:", err);
        return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const shop_id = req.nextUrl.searchParams.get("shop_id");
        const body = await req.json();

        console.log('PUT request body:', JSON.stringify(body, null, 2));

        if (!shop_id) {
            return NextResponse.json(
                { error: "Missing required fields: shop_id" },
                { status: 400 }
            );
        }

        // Validate request body
        if (!body || typeof body !== 'object') {
            return NextResponse.json(
                { error: "Invalid request body" },
                { status: 400 }
            );
        }

        // Get shop and app info using unified schema
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

        // Ensure this is a TikTok shop
        if (credentials.app?.channel !== 'TIKTOK') {
            return NextResponse.json({ error: "Not a TikTok shop" }, { status: 400 });
        }

        const app_key = credentials.app.appKey;
        const app_secret = credentials.app.appSecret;
        const baseUrl = process.env.TIKTOK_BASE_URL;

        // Extract shopCipher from channelData
        let shopCipher: string | undefined = credentials.shopCipher ?? undefined; // Legacy field
        if (credentials.channelData) {
            try {
                const channelData = JSON.parse(credentials.channelData);
                shopCipher = channelData.shopCipher ?? shopCipher;
            } catch (error) {
                console.warn('Failed to parse channelData, using legacy shopCipher');
            }
        }

        console.log('Request parameters:', {
            shop_id,
            shopCipher,
            accessToken: credentials.accessToken ? 'present' : 'missing',
            body
        });

        const client = new TikTokShopNodeApiClient({
            config: {
                basePath: baseUrl,
                app_key: app_key,
                app_secret: app_secret,
            },
        });
        
        try {
            const result = await client.api.EventV202309Api.WebhooksPut(
                credentials.accessToken, 
                "application/json", 
                shopCipher,
                body
            );
            console.log('WebhooksPut success response: ', JSON.stringify(result, null, 2));
            return NextResponse.json(result);
        } catch (apiError: any) {
            console.error('TikTok API Error Details:', {
                statusCode: apiError.statusCode,
                response: apiError.response,
                body: apiError.body
            });
            
            // Return more detailed error information
            return NextResponse.json({
                error: "TikTok API Error",
                details: {
                    statusCode: apiError.statusCode,
                    message: apiError.body?.message || 'Unknown API error',
                    code: apiError.body?.code,
                    request_id: apiError.body?.request_id
                }
            }, { status: apiError.statusCode || 500 });
        }

    } catch (err: any) {
        console.error("Error updating webhooks:", err);
        return NextResponse.json({
            error: "Internal server error",
            details: err.message
        }, { status: 500 });
    }
}