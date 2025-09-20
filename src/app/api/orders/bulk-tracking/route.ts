import { Fulfillment202309BatchShipPackagesRequestBody, Fulfillment202309BatchShipPackagesRequestBodyPackages, Fulfillment202309BatchShipPackagesRequestBodyPackagesSelfShipment, TikTokShopNodeApiClient } from '@/nodejs_sdk';
import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

type BulkRow = {
    shopId: string;
    packageId: string;
    trackingId: string;
    providerId: string;
    orderId?: string;
};

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
    try {
        const body = await req.json().catch(() => ({}));
        const rows: BulkRow[] = Array.isArray(body?.rows) ? body.rows : [];

        if (!rows.length) {
            return NextResponse.json({ error: 'rows is required and must be a non-empty array' }, { status: 400 });
        }

        // Group by shopId
        const groups = new Map<string, BulkRow[]>();
        const inputErrors: any[] = [];

        for (const r of rows) {
            const shopId = String(r?.shopId || '').trim();
            if (!shopId) {
                inputErrors.push({
                    code: 'MISSING_SHOP_ID',
                    message: 'shopId is required',
                    packageId: r?.packageId || null,
                    orderId: r?.orderId || null,
                });
                continue;
            }
            if (!groups.has(shopId)) groups.set(shopId, []);
            groups.get(shopId)!.push(r);
        }

        // Call addTracking per shopId in parallel
        const groupResults = await Promise.all(
            Array.from(groups.entries()).map(async ([shopId, groupRows]) => {
                const res = await addTracking(groupRows, shopId);
                return { ...res };
            })
        );

        // Merge errors and compute summary
        const apiErrors = groupResults.flatMap(gr =>
            (gr.errors || []).map((e: any) => ({
                shopId: gr.shopId,
                packageId: e?.detail?.packageId ?? e?.packageId ?? null,
                code: e?.code ?? 'UNKNOWN',
                message: e?.message ?? 'Unknown error',
            }))
        );

        const submitted = Array.from(groups.values()).reduce((sum, arr) => sum + arr.length, 0);
        const failed = apiErrors.length + inputErrors.length;
        const succeeded = Math.max(submitted - failed, 0);

        return NextResponse.json(
            {
                summary: {
                    groups: groups.size,
                    submitted,
                    succeeded,
                    failed,
                },
                errors: [...inputErrors, ...apiErrors],
                results: groupResults, // raw per-shop responses if caller needs details
            },
            { status: 200 }
        );
    } catch (err) {
        console.error('bulk-tracking POST error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// Make addTracking return structured data (no NextResponse)
async function addTracking(rows: BulkRow[], shop_id: string): Promise<{ shopId: string; data?: any; errors?: any[]; error?: string }> {
    const shopId = String(shop_id || '').trim();
    if (!shopId) {
        return { shopId, error: 'Missing required fields: shop_id' };
    }

    // Get shop + app credentials
    const credentials = await prisma.shopAuthorization.findUnique({
        where: { shopId: shopId },
        include: { app: true },
    });

    if (!credentials) {
        return { shopId, error: 'Shop not found' };
    }
    if (credentials.app?.channel !== 'TIKTOK') {
        return { shopId, error: 'Not a TikTok shop' };
    }

    const app_key = credentials.app.appKey;
    const app_secret = credentials.app.appSecret;
    const baseUrl = credentials.app.BaseUrl ?? process.env.TIKTOK_BASE_URL;

    // Extract shopCipher
    let shopCipher: string | undefined = credentials.shopCipher ?? undefined;
    if (credentials.channelData) {
        try {
            const channelData = JSON.parse(credentials.channelData);
            shopCipher = channelData.shopCipher ?? shopCipher;
        } catch {
            // ignore JSON parse error, fallback to legacy field
        }
    }

    const client = new TikTokShopNodeApiClient({
        config: {
            basePath: baseUrl,
            app_key,
            app_secret,
        },
    });

    const body = new Fulfillment202309BatchShipPackagesRequestBody();
    body.packages = [];

    for (const row of rows) {
        const pkgId = String(row?.packageId || '').trim();
        const trackingId = String(row?.trackingId || '').trim();
        const providerId = String(row?.providerId || '').trim();
        const orderId = String(row?.orderId || '').trim();

        if (!pkgId || !trackingId || !providerId || !orderId) {
            // skip invalid rows
            continue;
        }

        const pkg = new Fulfillment202309BatchShipPackagesRequestBodyPackages();
        pkg.id = pkgId;
        const selfShip = new Fulfillment202309BatchShipPackagesRequestBodyPackagesSelfShipment();
        selfShip.trackingNumber = trackingId;
        selfShip.shippingProviderId = providerId;
        pkg.selfShipment = selfShip;
        body.packages.push(pkg);
    }

    try {
        const resp = await client.api.FulfillmentV202309Api.PackagesShipPost(
            credentials.accessToken,
            'application/json',
            shopCipher,
            body
        );
        const data = resp?.body;
        const errors = data?.data?.errors ?? [];
        return { shopId, data, errors };
    } catch (e: any) {
        return { shopId, error: e?.message || 'TikTok API call failed' };
    }
}