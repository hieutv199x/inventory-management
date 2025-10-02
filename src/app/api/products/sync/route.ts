import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { TikTokShopNodeApiClient } from '@/nodejs_sdk';
import { Product202309CreateProductRequestBody } from '@/nodejs_sdk';
import { getUserWithShopAccess } from '@/lib/auth';

const prisma = new PrismaClient();

interface SyncProductRequest {
    productId: string; // Local product ID
    shopId: string; // Shop to sync to
    saveAs?: 'AS_DRAFT' | 'LISTING'; // How to save on TikTok
}

export async function POST(req: NextRequest) {
    try {
        const { user, accessibleShopIds, isAdmin } = await getUserWithShopAccess(req, prisma);
        const body: SyncProductRequest = await req.json();

        // Fetch product with all relations (product may not have shopId yet)
        const product = await prisma.product.findUnique({
            where: { productId: body.productId },
            include: {
                brand: true,
                images: true,
                skus: {
                    include: {
                        price: true,
                        inventory: true
                    }
                },
                attributes: {
                    include: {
                        values: true
                    }
                },
                dimensions: true,
                weight: true
            }
        });

        if (!product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        // Fetch shop authorization
        const shopAuth = await prisma.shopAuthorization.findUnique({
            where: { id: body.shopId },
            include: {
                app: true
            }
        });

        if (!shopAuth) {
            return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
        }

        // Check access
        if (!isAdmin && !accessibleShopIds.includes(shopAuth.shopId)) {
            return NextResponse.json({ error: 'Access denied to this shop' }, { status: 403 });
        }

        if (!shopAuth.app) {
            return NextResponse.json({ error: 'App configuration not found' }, { status: 404 });
        }

        // Parse channel data
        const channelData = product.channelData ? JSON.parse(product.channelData) : {};

        // Initialize TikTok client
        const client = new TikTokShopNodeApiClient({
            config: {
                basePath: shopAuth.app.BaseUrl ?? process.env.TIKTOK_BASE_URL,
                app_key: shopAuth.app.appKey,
                app_secret: shopAuth.app.appSecret,
            },
        });

        // Build create product request body
        const createProductBody = new Product202309CreateProductRequestBody();
        
        // Basic product info
        createProductBody.title = product.title;
        createProductBody.description = product.description;
        createProductBody.categoryId = channelData.categoryId;
        createProductBody.categoryVersion = channelData.categoryVersion || 'v1';
        createProductBody.isCodAllowed = channelData.isCodAllowed ?? false;
        createProductBody.isPreOwned = channelData.isPreOwned ?? false;

        // Brand
        if (product.brand) {
            createProductBody.brandId = product.brand.brandId;
        }

        // Main images
        if (product.images?.length > 0) {
            createProductBody.mainImages = product.images.map(img => ({
                uri: img.uri,
                width: img.width,
                height: img.height
            }));
        }

        // Package dimensions
        if (product.dimensions) {
            createProductBody.packageDimensions = {
                height: product.dimensions.height,
                length: product.dimensions.length,
                width: product.dimensions.width,
                unit: product.dimensions.unit
            };
        }

        // Package weight
        if (product.weight) {
            createProductBody.packageWeight = {
                value: product.weight.value,
                unit: product.weight.unit
            };
        }

        // Product attributes
        if (product.attributes?.length > 0) {
            createProductBody.productAttributes = product.attributes.map(attr => ({
                id: attr.attrId,
                name: attr.name,
                values: attr.values?.map(val => ({
                    id: val.valueId,
                    name: val.name
                })) || []
            }));
        }

        // SKUs
        if (product.skus?.length > 0) {
            createProductBody.skus = product.skus.map(sku => {
                const skuData: any = {
                    sellerSku: sku.sellerSku
                };

                // Price
                if (sku.price) {
                    skuData.price = {
                        currency: sku.price.currency,
                        salePrice: sku.price.salePrice,
                        taxExclusivePrice: sku.price.taxExclusivePrice
                    };
                }

                // Inventory
                if (sku.inventory?.length > 0) {
                    skuData.inventory = sku.inventory.map(inv => ({
                        warehouseId: inv.warehouseId,
                        quantity: inv.quantity
                    }));
                }

                return skuData;
            });
        }

        // Call TikTok API to create product
        const result = await client.api.ProductV202309Api.ProductsPost(
            shopAuth.accessToken,
            'application/json',
            shopAuth.shopCipher ?? undefined,
            createProductBody
        );

        if (result.body.code === 0 && result.body.data) {
            const tiktokProductId = result.body.data.productId;
            
            // Update local product with TikTok product ID and status, and link to shop
            await prisma.product.update({
                where: { id: product.id },
                data: {
                    productId: tiktokProductId, // Replace local ID with TikTok ID
                    shopId: shopAuth.id, // Link product to the shop
                    status: body.saveAs === 'AS_DRAFT' ? 'DRAFT' : 'PENDING',
                    updateTime: Math.floor(Date.now() / 1000),
                    channelData: JSON.stringify({
                        ...channelData,
                        tiktokProductId: tiktokProductId,
                        syncedAt: Date.now(),
                        syncStatus: 'SUCCESS'
                    })
                }
            });

            // Also update SKU IDs if provided by TikTok
            if (result.body.data.skus && product.skus) {
                for (let i = 0; i < result.body.data.skus.length; i++) {
                    const tiktokSku = result.body.data.skus[i];
                    const localSku = product.skus[i];
                    
                    if (tiktokSku.id && localSku) {
                        await prisma.sku.update({
                            where: { id: localSku.id },
                            data: {
                                skuId: tiktokSku.id,
                                channelData: JSON.stringify({
                                    tiktokSkuId: tiktokSku.id,
                                    syncedAt: Date.now()
                                })
                            }
                        });
                    }
                }
            }

            return NextResponse.json({
                success: true,
                tiktokProductId: tiktokProductId,
                tiktokResponse: result.body,
                message: 'Product synced to TikTok successfully'
            });

        } else {
            // Update sync status as failed
            await prisma.product.update({
                where: { id: product.id },
                data: {
                    channelData: JSON.stringify({
                        ...channelData,
                        syncStatus: 'FAILED',
                        syncError: result.body.message || 'Unknown error',
                        lastSyncAttempt: Date.now()
                    })
                }
            });

            return NextResponse.json({
                success: false,
                error: result.body.message || 'Sync failed',
                tiktokResponse: result.body
            }, { status: 400 });
        }

    } catch (error: any) {
        console.error('Sync product error:', error);
        
        // Try to update sync status as failed if product exists
        try {
            const body: SyncProductRequest = await req.json();
            const product = await prisma.product.findUnique({
                where: { productId: body.productId }
            });
            
            if (product) {
                const channelData = product.channelData ? JSON.parse(product.channelData) : {};
                await prisma.product.update({
                    where: { id: product.id },
                    data: {
                        channelData: JSON.stringify({
                            ...channelData,
                            syncStatus: 'FAILED',
                            syncError: error.message || 'Unknown error',
                            lastSyncAttempt: Date.now()
                        })
                    }
                });
            }
        } catch (updateError) {
            console.error('Failed to update sync status:', updateError);
        }

        return NextResponse.json(
            { error: error.message || 'Failed to sync product to TikTok' },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}