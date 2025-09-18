import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, Channel } from "@prisma/client";
import { TikTokShopNodeApiClient } from '@/nodejs_sdk/client/client';

const prisma = new PrismaClient();

// In-memory per-instance cache (best effort on Vercel; improves warm invocations)
type CacheEntry = { data: any; expiresAt: number };
const shippingProviderCache = new Map<string, CacheEntry>();
const CACHE_TTL_S = Number(process.env.TIKTOK_SHIPPING_PROVIDER_CACHE_TTL_S || 300); // default 5 minutes
const CACHE_TTL_MS = CACHE_TTL_S * 1000;

const getCached = (key: string) => {
    const entry = shippingProviderCache.get(key);
    if (!entry) return null;
    if (entry.expiresAt < Date.now()) {
        shippingProviderCache.delete(key);
        return null;
    }
    return entry.data;
};

const setCached = (key: string, data: any) => {
    shippingProviderCache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
};

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);

        const orderId = searchParams.get("orderId");

        if (!orderId) {
            return NextResponse.json({ error: 'Missing orderId parameter' }, { status: 400 });
        }

        // Fetch order to get shopId
        const order = await prisma.order.findUnique({
            where: { orderId: orderId },
            include: { shop: { include: { app: true } } },
        });

        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        if (!order.shopId) {
            return NextResponse.json({ error: 'Shop authorization not found' }, { status: 404 });
        }
        const shop = order.shop;

        // Cache by shopId (no other logic changed)
        const cacheKey = `shipping_providers:${shop.shopId}`;
        const cached = getCached(cacheKey);
        if (cached) {
            return NextResponse.json(cached, {
                headers: {
                    'x-cache': 'HIT',
                    'cache-control': `s-maxage=${CACHE_TTL_S}, stale-while-revalidate=${CACHE_TTL_S}`,
                },
            });
        }

        const result: any[] = [];
        try {
            // Extract shopCipher from channelData
            let shopCipher = shop.shopCipher; // Legacy field
            if (shop.channelData) {
                try {
                    const channelData = JSON.parse(shop.channelData);
                    shopCipher = channelData.shopCipher || shopCipher;
                } catch (error) {
                    console.warn(`Failed to parse channelData for shop ${shop.shopId}, using legacy shopCipher`);
                }
            }

            if (!shop.app) {
                console.error(`Missing app information for shop ${shop.shopId}`);
                return NextResponse.json({ error: `Missing app information for shop ${shop.shopId}` }, { status: 404 });
            }

            const credentials = {
                accessToken: shop.accessToken,
                shopCipher: shopCipher,
                app: {
                    appKey: shop.app.appKey,
                    appSecret: shop.app.appSecret,
                    BaseUrl: shop.app.BaseUrl,
                },
            };

            if (!credentials.accessToken || !credentials.shopCipher) {
                console.error(`Missing credentials for shop ${shop.shopId}`);
                return NextResponse.json({ error: `Missing credentials for shop ${shop.shopId}` }, { status: 404 });
            }
            let basePath = process.env.TIKTOK_BASE_URL;
            if (credentials.app?.BaseUrl) {
                basePath = credentials.app.BaseUrl;
            }

            const client = new TikTokShopNodeApiClient({
                config: {
                    basePath: basePath,
                    app_key: credentials.app.appKey,
                    app_secret: credentials.app.appSecret,
                },
            });

            const warehousesResponse = await client.api.LogisticsV202309Api.WarehousesGet(shop.accessToken, 'application/json', credentials.shopCipher);

            if (warehousesResponse.body.code !== 0) {
                console.error(`Failed to fetch warehouses for shop ${shop.shopId}:`, warehousesResponse);
                return NextResponse.json({ error: `Failed to fetch warehouses for shop ${shop.shopId}` }, { status: 500 });
            }
            const warehouses = warehousesResponse.body.data?.warehouses || [];

            for (const wh of warehouses) {
                const deliveryOptions = await client.api.LogisticsV202309Api.WarehousesWarehouseIdDeliveryOptionsGet(
                    wh.id || "",
                    shop.accessToken,
                    'application/json',
                    "WAREHOUSE",
                    credentials.shopCipher || ""
                );
                if (deliveryOptions.body.data?.deliveryOptions) {
                    for (const option of deliveryOptions.body.data.deliveryOptions) {
                        const shippingProviders = await client.api.LogisticsV202309Api.DeliveryOptionsDeliveryOptionIdShippingProvidersGet(option.id || "", shop.accessToken, 'application/json', credentials.shopCipher || "");
                        if (shippingProviders.body.data?.shippingProviders) {
                            for (const provider of shippingProviders.body.data.shippingProviders) {
                                if (!result.includes(provider)) {
                                    result.push(provider);
                                }
                            }
                        }
                    }
                }
            }

        } catch (error) {
            console.error(`Error processing shop ${shop.shopId}:`, error);
            return NextResponse.json({ error: `Error processing shop ${shop.shopId}` }, { status: 500 });
        }

        // Save to cache and return (no other logic changed)
        setCached(cacheKey, result);
        return NextResponse.json(result, {
            headers: {
                'x-cache': 'MISS',
                'cache-control': `s-maxage=${CACHE_TTL_S}, stale-while-revalidate=${CACHE_TTL_S}`,
            },
        });
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}