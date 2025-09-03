import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import {AccessTokenTool, TikTokShopNodeApiClient} from '@/nodejs_sdk'

const prisma = new PrismaClient();

export async function POST(req: Request) {
    try {
        const { code, app_key } = await req.json();

        if (!code || !app_key) {
            return NextResponse.json({ error: 'Authorization auth_code, app_key is missing' }, { status: 400 });
        }

        const credential = await prisma.channelApp.findUnique({
            where: { 
                appKey: app_key,
                channel: 'TIKTOK' 
            },
        });

        if (!credential) {
            return NextResponse.json({ error: 'App key not found in database' }, { status: 400 });
        }
        const appSecret = credential.appSecret;

        if (!appSecret) {
            return NextResponse.json({ error: 'App secret is missing in database' }, { status: 500 });
        }
        const { body } = await AccessTokenTool.getAccessToken(code, app_key, appSecret);
        console.log('getAccessToken resp data := ', JSON.stringify(body, null, 2));
        const parsedBody = typeof body === 'string' ? JSON.parse(body) : body;
        const tokenData = parsedBody.data;
        if (!tokenData?.access_token) {
            throw new Error('Failed to retrieve access token from TikTok');
        }
        const { access_token, refresh_token, access_token_expire_in, granted_scopes } = tokenData;

        //shopAuthen
        const baseUrl = process.env.TIKTOK_BASE_URL;

        const client = new TikTokShopNodeApiClient({
            config: {
                basePath: baseUrl,
                app_key: app_key,
                app_secret: appSecret,
            },
        });

        const result = await client.api.AuthorizationV202309Api.ShopsGet(access_token, "application/json");
        console.log('response: ', JSON.stringify(result, null, 2));

        const parsedResult = typeof result === 'string' ? JSON.parse(result) : result;

        if (parsedResult.body.code !== 0) {
            throw new Error(`Error getting shop info: ${parsedResult.body.message}`);
        }
        const shops = parsedResult.body.data?.shops ?? [];

        for (const shop of shops) {
            // Prepare channelData for TikTok-specific fields
            const channelData = {
                shopCipher: shop.cipher,
                region: shop.region,
            };

            await prisma.shopAuthorization.upsert({
                where: { shopId: shop.id },
                update: {
                    accessToken: access_token,
                    refreshToken: refresh_token,
                    expiresIn: access_token_expire_in,
                    scope: granted_scopes.join(','),
                    shopName: shop.name,
                    region: shop.region, // Keep legacy field for compatibility
                    shopCipher: shop.cipher, // Keep legacy field for compatibility
                    channelData: JSON.stringify(channelData), // Store in new unified format
                    status: 'ACTIVE',
                },
                create: {
                    shopId: shop.id,
                    shopCipher: shop.cipher, // Legacy field
                    shopName: shop.name,
                    region: shop.region, // Legacy field
                    channelData: JSON.stringify(channelData), // New unified format
                    accessToken: access_token,
                    refreshToken: refresh_token,
                    expiresIn: access_token_expire_in,
                    scope: granted_scopes.join(','),
                    status: 'ACTIVE',
                    appId: credential.id, // Link to ChannelApp
                },
            });
        }

        return NextResponse.json(shops, { status: 200 });

    } catch (error) {
        console.error("Error exchanging TikTok token:", error);
        if (error instanceof SyntaxError) {
            return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
        }
        return NextResponse.json({ error: "An internal server error occurred" }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}

