import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { TikTokShopNodeApiClient } from '@/nodejs_sdk'
import { getTikTokCredentialByAppKey } from '../common/common';

const prisma = new PrismaClient();


export async function GET(req: Request) {
    try {
        const { app_key } = await req.json();

        const credential = await getTikTokCredentialByAppKey(app_key);

            if (!credential) {
                return NextResponse.json({ error: "credential is missing in database" }, { status: 400 });
            }
            const appSecret = credential.appSecret;

            if (!appSecret) {
                return NextResponse.json({ error: 'App secret is missing in database' }, { status: 500 });
            }

            const accesstoken = credential.accessToken;
            
            if (!accesstoken) {
                return NextResponse.json({ error: "Access token is missing in database" }, { status: 400 });
            }

            const baseUrl = process.env.TIKTOK_BASE_URL;

            const client = new TikTokShopNodeApiClient({
                config: {
                    basePath: baseUrl,
                    app_key: app_key,
                    app_secret: appSecret,
                },
            });

            const result = await client.api.AuthorizationV202309Api.ShopsGet(accesstoken, "application/json");
            console.log('response: ', JSON.stringify(result, null, 2));
            const parsedResult = typeof result === 'string' ? JSON.parse(result) : result;
            const data = parsedResult.data;
            const shops = parsedResult.data?.shops ?? [];

            for (const shop of shops) {
                await prisma.tikTokAuthorizedShop.upsert({
                    where: { shopCipher: shop.cipher },
                    update: {
                    shopId: shop.id,
                    name: shop.name,
                    region: shop.region,
                    sellerType: shop.seller_type,
                    code: shop.code,
                    appCredentialId: credential.id,
                    },
                    create: {
                    shopId: shop.id,
                    name: shop.name,
                    region: shop.region,
                    sellerType: shop.seller_type,
                    shopCipher: shop.cipher,
                    code: shop.code,
                    appCredentialId: credential.id,
                    },
                });
            }


        return NextResponse.json(result, { status: 200 });

    } catch (error) {
        console.error("Error exchanging TikTok token:", error);
        // Handle cases where the request body is not valid JSON
        if (error instanceof SyntaxError) {
            return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
        }
        return NextResponse.json({ error: "An internal server error occurred" }, { status: 500 });
    }
}
