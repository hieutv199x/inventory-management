import { prisma } from './prisma';
import { TikTokShopNodeApiClient } from '@/nodejs_sdk';
import { Channel } from '@prisma/client';

export interface TikTokProductSyncResult {
    success: boolean;
    productId: string;
    created: boolean;
    updated: boolean;
    shopId: string;
    errors?: string[];
}

interface CreateSyncClientResult {
    client: TikTokShopNodeApiClient;
    credentials: any;
    shopCipher?: string;
}

async function createClientForShop(shopId: string): Promise<CreateSyncClientResult> {
    const credentials = await prisma.shopAuthorization.findUnique({
        where: { shopId, status: 'ACTIVE' },
        include: { app: true }
    });
    if (!credentials) throw new Error('Shop not found or inactive');
    if (credentials.app?.channel !== 'TIKTOK') throw new Error('Not a TikTok shop');

    let shopCipher: string | undefined = credentials.shopCipher ?? undefined;
    if (credentials.channelData) {
        try { shopCipher = JSON.parse(credentials.channelData).shopCipher ?? shopCipher; } catch { }
    }
    const basePath = credentials.app?.BaseUrl ?? process.env.TIKTOK_BASE_URL;
    const client = new TikTokShopNodeApiClient({
        config: {
            basePath,
            app_key: credentials.app.appKey,
            app_secret: credentials.app.appSecret,
        }
    });
    return { client, credentials, shopCipher };
}

const safeString = (v: any, fallback: string = '[]') => {
    try { return JSON.stringify(v ?? []); } catch { return fallback; }
};

export async function syncTikTokProductById(params: { shopId: string; productId: string; forceUpdate?: boolean }): Promise<TikTokProductSyncResult> {
    const { shopId, productId, forceUpdate } = params;
    const result: TikTokProductSyncResult = { success: false, productId, created: false, updated: false, shopId, errors: [] };

    try {
        const { client, credentials, shopCipher } = await createClientForShop(shopId);

        // fetch product detail
        // Use 202309 product detail API (202502 spec only exposes search in generated SDK)
        const apiResp = await client.api.ProductV202309Api.ProductsProductIdGet(
            productId,
            credentials.accessToken,
            'application/json',
            false,
            false,
            undefined,
            shopCipher
        );

        if (apiResp.body.code !== 0 || !apiResp.body.data) {
            throw new Error(`API error code=${apiResp.body.code} message=${apiResp.body.message}`);
        }

        // Cast to any because 202309 product detail schema may not include newer fields (202502 additions)
        const pd: any = apiResp.body.data;

        // Map new product-level fields (tolerant of absence)
        const salesRegions = pd?.salesRegions ?? [];
        const productSyncFailReasons = pd?.productSyncFailReasons ?? [];
        const isNotForSale = pd?.isNotForSale ?? false;
        const recommendedCategoriesRaw = pd?.recommendedCategories ?? [];
        const listingQualityTier = pd?.listingQualityTier ?? null;
        const integratedPlatformStatusesRaw = pd?.integratedPlatformStatuses ?? [];
        const productFamiliesRaw = pd?.productFamilies ?? [];
        const hasDraft = pd?.hasDraft ?? false;

        const existing = await prisma.product.findUnique({ where: { productId } });

        const productData: any = {
            productId,
            channel: 'TIKTOK' as Channel,
            shopId: credentials.id,
            title: pd.title ?? '',
            description: pd.description ?? '',
            status: pd.status ?? '',
            price: pd.skus?.[0]?.price?.salePrice,
            currency: pd.skus?.[0]?.price?.currency,
            createTime: pd.createTime ?? 0,
            updateTime: pd.updateTime ?? 0,
            salesRegions,
            productSyncFailReasons,
            isNotForSale,
            recommendedCategories: safeString(recommendedCategoriesRaw),
            listingQualityTier,
            integratedPlatformStatuses: safeString(integratedPlatformStatusesRaw),
            productFamilies: safeString(productFamiliesRaw),
            hasDraft,
            channelData: JSON.stringify({
                isNotForSale,
                isCodAllowed: pd.isCodAllowed ?? false,
                isPreOwned: pd.isPreOwned ?? false,
                shippingInsuranceRequirement: pd.shippingInsuranceRequirement ?? '',
                originalShopId: credentials.shopId,
            })
        };

        // Brand
        let brandId: string | null = null;
        if (pd.brand?.id) {
            const brand = await prisma.brand.upsert({
                where: { brandId: pd.brand.id },
                create: { brandId: pd.brand.id, name: pd.brand.name ?? '' },
                update: { name: pd.brand.name ?? '' }
            });
            brandId = brand.id;
        }

        // Audit
        let auditId: string | null = null;
        if (pd.audit) {
            const audit = await prisma.audit.create({
                data: {
                    status: pd.audit.status ?? '',
                    preApprovedReasons: pd.audit.preApprovedReasons ?? [],
                    failedReasons: pd.audit.failedReasons ?? [],
                    suggestions: pd.audit.suggestions ?? []
                }
            }).catch(() => null);
            auditId = audit?.id ?? null;
        }

        productData.brandId = brandId;
        productData.auditId = auditId;

        if (!existing) {
            await prisma.product.create({ data: productData });
            result.created = true;
        } else if (forceUpdate) {
            await prisma.product.update({ where: { productId }, data: productData });
            result.updated = true;
        } else {
            result.success = true; // nothing changed
            return result;
        }

        // Related (images, categories, attributes, dimensions, weight, skus)
        await upsertRelated(pd, existing?.id || (await prisma.product.findUnique({ where: { productId } }))!.id);

        result.success = true;
        return result;
    } catch (e: any) {
        result.errors?.push(e.message || 'UNKNOWN');
        return result;
    }
}

async function upsertRelated(pd: any, productDbId: string) {
    // Images: For simplicity, only insert new ones if product newly created (no dedupe hash here)
    if (pd.mainImages?.length) {
        await prisma.productImage.createMany({
            data: pd.mainImages.map((img: any) => ({
                productId: productDbId,
                uri: img.uri ?? '',
                width: img.width ?? 0,
                height: img.height ?? 0,
                urls: img.urls ?? [],
                thumbUrls: img.thumbUrls ?? []
            }))
        }).catch(() => { });
    }

    // Categories
    if (pd.categoryChains?.length) {
        for (const cat of pd.categoryChains) {
            await prisma.categoryChain.upsert({
                where: { productId_categoryId: { productId: productDbId, categoryId: cat.id } },
                create: { productId: productDbId, categoryId: cat.id, localName: cat.localName ?? '', parentId: cat.parentId ?? '', isLeaf: !!cat.isLeaf },
                update: { localName: cat.localName ?? '', parentId: cat.parentId ?? '', isLeaf: !!cat.isLeaf }
            }).catch(() => { });
        }
    }

    // Attributes & values
    if (pd.productAttributes?.length) {
        for (const attr of pd.productAttributes) {
            const attrRecord = await prisma.productAttribute.upsert({
                where: { productId_attrId: { productId: productDbId, attrId: attr.id } },
                create: { productId: productDbId, attrId: attr.id, name: attr.name ?? '' },
                update: { name: attr.name ?? '' }
            });
            if (attr.values?.length) {
                for (const val of attr.values) {
                    await prisma.attributeValue.upsert({
                        where: { productAttributeId_valueId: { productAttributeId: attrRecord.id, valueId: val.id } },
                        create: { productAttributeId: attrRecord.id, valueId: val.id, name: val.name ?? '' },
                        update: { name: val.name ?? '' }
                    });
                }
            }
        }
    }

    // Dimensions
    if (pd.packageDimensions) {
        await prisma.packageDimension.upsert({
            where: { productId: productDbId },
            create: { productId: productDbId, height: pd.packageDimensions.height ?? '', length: pd.packageDimensions.length ?? '', width: pd.packageDimensions.width ?? '', unit: pd.packageDimensions.unit ?? '' },
            update: { height: pd.packageDimensions.height ?? '', length: pd.packageDimensions.length ?? '', width: pd.packageDimensions.width ?? '', unit: pd.packageDimensions.unit ?? '' }
        }).catch(() => { });
    }

    // Weight
    if (pd.packageWeight) {
        await prisma.packageWeight.upsert({
            where: { productId: productDbId },
            create: { productId: productDbId, value: pd.packageWeight.value ?? '', unit: pd.packageWeight.unit ?? '' },
            update: { value: pd.packageWeight.value ?? '', unit: pd.packageWeight.unit ?? '' }
        }).catch(() => { });
    }

    // SKUs
    if (pd.skus?.length) {
        for (const sku of pd.skus) {
            const listPrice = sku.listPrice ?? sku.list_price;
            const externalListPricesRaw = sku.externalListPrices ?? sku.external_list_prices ?? [];
            const preSale = sku.preSale ?? sku.pre_sale;
            const fulfillmentType = preSale?.fulfillmentType ?? preSale?.fulfillment_type;
            const statusInfo = sku.statusInfo ?? sku.status_info;

            const skuRecord = await prisma.sku.upsert({
                where: { skuId: sku.id },
                create: {
                    skuId: sku.id,
                    productId: productDbId,
                    sellerSku: sku.sellerSku ?? '',
                    listPriceAmount: listPrice?.amount ?? null,
                    listPriceCurrency: listPrice?.currency ?? null,
                    externalListPrices: JSON.stringify(externalListPricesRaw ?? []),
                    preSaleType: preSale?.type ?? null,
                    preSaleHandlingDurationDays: fulfillmentType?.handlingDurationDays ?? fulfillmentType?.handling_duration_days ?? null,
                    preSaleReleaseDate: fulfillmentType?.releaseDate ?? fulfillmentType?.release_date ?? null,
                    skuStatus: statusInfo?.status ?? null,
                    skuDeactivationSource: statusInfo?.deactivationSource ?? statusInfo?.deactivation_source ?? null,
                },
                update: {
                    sellerSku: sku.sellerSku ?? '',
                    listPriceAmount: listPrice?.amount ?? null,
                    listPriceCurrency: listPrice?.currency ?? null,
                    externalListPrices: JSON.stringify(externalListPricesRaw ?? []),
                    preSaleType: preSale?.type ?? null,
                    preSaleHandlingDurationDays: fulfillmentType?.handlingDurationDays ?? fulfillmentType?.handling_duration_days ?? null,
                    preSaleReleaseDate: fulfillmentType?.releaseDate ?? fulfillmentType?.release_date ?? null,
                    skuStatus: statusInfo?.status ?? null,
                    skuDeactivationSource: statusInfo?.deactivationSource ?? statusInfo?.deactivation_source ?? null,
                }
            });

            // Price
            if (sku.price) {
                await prisma.price.upsert({
                    where: { skuId: skuRecord.id },
                    create: { skuId: skuRecord.id, currency: sku.price.currency ?? '', salePrice: sku.price.salePrice ?? '', taxExclusivePrice: sku.price.taxExclusivePrice ?? '' },
                    update: { currency: sku.price.currency ?? '', salePrice: sku.price.salePrice ?? '', taxExclusivePrice: sku.price.taxExclusivePrice ?? '' }
                }).catch(() => { });
            }

            // Inventory
            if (sku.inventory?.length) {
                for (const inv of sku.inventory) {
                    await prisma.inventory.upsert({
                        where: { skuId_warehouseId: { skuId: skuRecord.id, warehouseId: inv.warehouseId } },
                        create: { skuId: skuRecord.id, warehouseId: inv.warehouseId, quantity: inv.quantity ?? 0 },
                        update: { quantity: inv.quantity ?? 0 }
                    }).catch(() => { });
                }
            }
        }
    }
}
