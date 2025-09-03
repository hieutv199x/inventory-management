import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { generateSign } from '../../common/common';

const prisma = new PrismaClient();
export async function GET(req: Request) {
    try {
        const { app_key } = await req.json();

        // Get TikTok ChannelApp instead of TikTokApp
        const credential = await prisma.channelApp.findUnique({
            where: { 
                appKey: app_key,
                channel: 'TIKTOK'
            },
        });

        const ts = Math.floor(new Date().getTime() / 1000);
        const urlPath = "/seller/202309/shops";
        const baseUrl = process.env.TIKTOK_BASE_URL;
        
        if (!credential) {
            return NextResponse.json({ error: "TikTok credential is missing in database" }, { status: 400 });
        }
        
        const appSecret = credential.appSecret;

        if (!appSecret) {
            return NextResponse.json({ error: 'App secret is missing in database' }, { status: 400 });
        }

        // Get access token from a shop authorization (since ChannelApp doesn't store access tokens)
        const shopAuth = await prisma.shopAuthorization.findFirst({
            where: { 
                appId: credential.id,
                status: 'ACTIVE'
            }
        });

        if (!shopAuth) {
            return NextResponse.json({ error: "No active shop authorization found for this app" }, { status: 400 });
        }

        const accesstoken = shopAuth.accessToken;
        
        if (!accesstoken) {
            return NextResponse.json({ error: "Access token is missing" }, { status: 400 });
        }

        if (!baseUrl) {
            return NextResponse.json({ error: 'baseUrl is missing ' }, { status: 400 });
        }

        const sign = generateSign(baseUrl, urlPath, app_key, ts, appSecret, "GET");

        const url = new URL(`${baseUrl}${urlPath}`);
        url.searchParams.append("app_key", app_key);
        url.searchParams.append("timestamp", ts.toString());
        url.searchParams.append("sign", sign);

        const tiktokResponse = await fetch(url.toString(), {
            method: 'GET', // As per your original implementation
            headers: {
                'Content-Type': 'application/json',
                'x-tts-access-token': accesstoken,
            },
        });
       
        const data = await tiktokResponse.json();

        if (!tiktokResponse.ok) {
            console.error("TikTok API Error:", data);
            return NextResponse.json({ error: 'Failed to info shop with TikTok', details: data }, { status: tiktokResponse.status });
        }
        const activeShops = data?.data?.shops || [];
        
        // Update shop statuses using unified ShopAuthorization model
        const allShops = await prisma.shopAuthorization.findMany({
            where: {
                app: { channel: 'TIKTOK' }
            }
        });
        
        const activeIds = new Set(activeShops.map((s: any) => s.id));
        
        for (const shop of allShops) {
            const newStatus = activeIds.has(shop.shopId) ? 'ACTIVE' : 'INACTIVE';
            await prisma.shopAuthorization.update({
                where: { id: shop.id },
                data: { status: newStatus },
            });
        }

        return NextResponse.json(data, { status: 200 });

    } catch (error) {
        console.error("Error exchanging TikTok token:", error);
        // Handle cases where the request body is not valid JSON
        if (error instanceof SyntaxError) {
            return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
        }
        return NextResponse.json({ error: "An internal server error occurred" }, { status: 500 });
    }
}