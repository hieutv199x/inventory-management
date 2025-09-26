import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import {
    Product202502SearchProductsRequestBody,
    TikTokShopNodeApiClient,
} from "@/nodejs_sdk";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const shop_id = body.shop_id;
        const page_size = body.page_size || 100;
        const sync = body.sync || true; // Mặc định là sync vào DB

        if (!shop_id) {
            return NextResponse.json(
                { error: "Missing required fields: shop_id" },
                { status: 400 }
            );
        }

        // Lấy thông tin shop và app
        const credentials = await prisma.shopAuthorization.findUnique({
            where: {
                id: shop_id,
            },
            include: {
                app: true,
            },
        });

        if (!credentials) {
            return NextResponse.json({ error: "Shop not found" }, { status: 404 });
        }

        if (!credentials.app) {
            return NextResponse.json({ error: "App information not found for this shop" }, { status: 404 });
        }
        const app_key = credentials.app.appKey;
        const app_secret = credentials.app.appSecret;
        const baseUrl =  credentials.app.BaseUrl ?? process.env.TIKTOK_BASE_URL;

        const searchBody = new Product202502SearchProductsRequestBody();
        searchBody.status = body.status;

        const client = new TikTokShopNodeApiClient({
            config: {
                basePath: baseUrl,
                app_key: app_key,
                app_secret: app_secret,
            },
        });

        // Get first page
        const result = await client.api.ProductV202502Api.ProductsSearchPost(
            page_size,
            credentials.accessToken,
            'application/json',
            "",
            credentials.shopCipher ?? undefined,
            searchBody
        );

        let allProducts = [...(result.body?.data?.products || [])];
        let nextPageToken = result.body?.data?.nextPageToken;

        // Continue fetching all pages if there are more
        while (nextPageToken) {
            try {
                console.log(`Fetching next page of products with token: ${nextPageToken}`);
                
                const nextPageResult = await client.api.ProductV202502Api.ProductsSearchPost(
                    page_size,
                    credentials.accessToken,
                    'application/json',
                    nextPageToken,
                    credentials.shopCipher ?? undefined,
                    searchBody
                );

                if (nextPageResult.body?.data?.products) {
                    allProducts.push(...nextPageResult.body.data.products);
                    console.log(`Fetched ${nextPageResult.body.data.products.length} more products. Total: ${allProducts.length}`);
                }

                nextPageToken = nextPageResult.body?.data?.nextPageToken;
                
                // Add a small delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 100));
                
            } catch (paginationError) {
                console.error('Error fetching next page of products:', paginationError);
                break;
            }
        }

        // Luôn luôn thực hiện sync vào database
        console.log(`Total products to sync: ${allProducts.length}`);
        const createdCount = await syncProductsToDatabase(allProducts, credentials.id, client, credentials);
        
        return NextResponse.json({
            ...result.body,
            syncInfo: {
                totalProductsProcessed: allProducts.length,
                totalProductsCreated: createdCount,
                pagesProcessed: Math.ceil(allProducts.length / page_size)
            }
        });

    } catch (err: any) {
        console.error('Sync failed:', err);
        return NextResponse.json({ error: err.message || 'Unknown error' }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}

async function syncProductsToDatabase(products: any[], shopObjectId: string, client: any, credentials: any) {
    const BATCH_SIZE = 10; // Reduce batch size to avoid timeout issues
    let totalCreated = 0;

    // Verify shop exists before starting
    try {
        const shop = await prisma.shopAuthorization.findUnique({
            where: { id: shopObjectId }
        });
        if (!shop) {
            return 0;
        }
        console.log(`✅ Shop found: ${shop.shopName || shop.shopId}`);
    } catch (error) {
        return 0;
    }

    // Process products in batches
    for (let i = 0; i < products.length; i += BATCH_SIZE) {
        const batch = products.slice(i, i + BATCH_SIZE);
        
        const batchCreated = await processProductBatch(batch, shopObjectId, client, credentials);
        totalCreated += batchCreated;
        
        // Add delay between batches
        await new Promise(resolve => setTimeout(resolve, 200));
    }

    return totalCreated;
}

async function processProductBatch(products: any[], shopObjectId: string, client: any, credentials: any) {
    let createdCount = 0;

    try {
        // Fetch detailed product information for all products in batch
        type ProductDetail = any;
        const productDetails: ProductDetail[] = [];
        
        for (const product of products) {
            try {
                const productId = product.id!;
                
                // Check if product already exists
                const existed = await prisma.product.findUnique({ where: { productId } });
                if (existed) {
                    continue;
                }

                const result = await client.api.ProductV202309Api.ProductsProductIdGet(
                    productId, 
                    credentials.accessToken, 
                    "application/json", 
                    false,
                    false, 
                    undefined,
                    credentials.shopCipher
                );

                if (result.body.code === 0 && result.body.data) {
                    productDetails.push(result.body.data);
                } else {
                }

                // Add delay between detail requests
                await new Promise(resolve => setTimeout(resolve, 50));
            } catch (error) {
                console.error('Error fetching product detail:', error);
            }
        }
        // Process each product individually to avoid large transaction timeouts
        for (const productDetail of productDetails) {
            try {
                const productId = productDetail.id;
                console.log(`\n🔄 Creating product ${productId}...`);

                // Removed prisma.$transaction (MongoDB setup) — operations below are non-atomic
                let brandRecord = null;
                if (productDetail.brand?.id) {
                    try {
                        brandRecord = await prisma.brand.upsert({
                            where: { brandId: productDetail.brand.id },
                            create: {
                                brandId: productDetail.brand.id,
                                name: productDetail.brand.name!,
                            },
                            update: {
                                name: productDetail.brand.name,
                            },
                        });
                    } catch (e) {
                        console.warn(`⚠️ Brand upsert failed for ${productDetail.brand.id}`, e);
                    }
                }

                let auditRecord = null;
                if (productDetail.audit) {
                    try {
                        auditRecord = await prisma.audit.create({
                            data: {
                                status: productDetail.audit.status!,
                                preApprovedReasons: productDetail.audit.preApprovedReasons ?? [],
                                failedReasons: productDetail.audit.failedReasons ?? [],
                                suggestions: productDetail.audit.suggestions ?? [],
                            },
                        });
                    } catch (e) {
                        console.warn(`⚠️ Audit create failed`, e);
                    }
                }

                // Final existence check to avoid duplicate create in race conditions
                const already = await prisma.product.findUnique({ where: { productId } });
                if (already) {
                    console.log(`➡️ Product ${productId} already exists (skipped create)`);
                    continue;
                }

                // Map extended product-level fields safely (support snake_case & camelCase from SDK/JSON)
                const salesRegions = productDetail.salesRegions ?? productDetail.sales_regions ?? [];
                const productSyncFailReasons = productDetail.productSyncFailReasons ?? productDetail.product_sync_fail_reasons ?? [];
                const isNotForSale = productDetail.isNotForSale ?? productDetail.is_not_for_sale ?? false;
                const recommendedCategoriesRaw = productDetail.recommendedCategories ?? productDetail.recommended_categories ?? [];
                const listingQualityTier = productDetail.listingQualityTier ?? productDetail.listing_quality_tier ?? null;
                const integratedPlatformStatusesRaw = productDetail.integratedPlatformStatuses ?? productDetail.integrated_platform_statuses ?? [];
                const productFamiliesRaw = productDetail.productFamilies ?? productDetail.product_families ?? [];
                const hasDraft = productDetail.hasDraft ?? productDetail.has_draft ?? false;

                const safeStringify = (v: any) => {
                    try { return JSON.stringify(v ?? []); } catch { return '[]'; }
                };

                const productCreated = await prisma.product.create({
                    data: {
                        productId,
                        channel: 'TIKTOK',
                        shopId: shopObjectId,
                        title: productDetail.title ?? "",
                        description: productDetail.description ?? "",
                        status: productDetail.status ?? "",
                        price: productDetail.skus?.[0]?.price?.salePrice,
                        currency: productDetail.skus?.[0]?.price?.currency,
                        createTime: productDetail.createTime ?? productDetail.create_time ?? 0,
                        updateTime: productDetail.updateTime ?? productDetail.update_time ?? 0,
                        // New extended fields - removed fields that don't exist in schema
                        channelData: JSON.stringify({
                            salesRegions: salesRegions,
                            productSyncFailReasons: productSyncFailReasons,
                            isNotForSale: isNotForSale,
                            recommendedCategories: recommendedCategoriesRaw,
                            listingQualityTier: listingQualityTier,
                            integratedPlatformStatuses: integratedPlatformStatusesRaw,
                            productFamilies: productFamiliesRaw,
                            hasDraft: hasDraft,
                            isCodAllowed: productDetail.isCodAllowed ?? productDetail.is_cod_allowed ?? false,
                            isPreOwned: productDetail.isPreOwned ?? productDetail.is_pre_owned ?? false,
                            shippingInsuranceRequirement: productDetail.shippingInsuranceRequirement ?? productDetail.shipping_insurance_requirement ?? "",
                            originalShopId: credentials.shopId
                        }),
                        brandId: brandRecord?.id ?? null,
                        auditId: auditRecord?.id ?? null,
                    }
                });

                if (productCreated) {
                    await handleProductRelatedData(productDetail, productCreated.id);
                    createdCount++;
                }
            } catch (error) {
                console.error(`❌ Error creating product ${productDetail.id}:`, error);
            }
        }
    } catch (error) {
        console.error('❌ Error processing product batch:', error);
    }

    return createdCount;
}

// Handle related data outside of main transaction
async function handleProductRelatedData(productDetail: any, productDbId: string) {
    try {
        // Handle images
        if (productDetail.mainImages?.length) {
            try {
                const imageData = productDetail.mainImages.map((img: any) => ({
                    productId: productDbId,
                    uri: img.uri!,
                    width: img.width ?? 0,
                    height: img.height ?? 0,
                    urls: img.urls ?? [],
                    thumbUrls: img.thumbUrls ?? [],
                }));
                
                await prisma.productImage.createMany({
                    data: imageData
                });
            } catch (error) {
                console.warn(`⚠️ Failed to create images:`, error);
            }
        }

        // Handle categories
        if (productDetail.categoryChains?.length) {
            try {
                const categoryData = productDetail.categoryChains.map((cat: any) => ({
                    productId: productDbId,
                    categoryId: cat.id!,
                    localName: cat.localName!,
                    parentId: cat.parentId!,
                    isLeaf: cat.isLeaf ?? false,
                }));
                
                await prisma.categoryChain.createMany({
                    data: categoryData
                });
            } catch (error) {
                console.warn(`⚠️ Failed to create categories:`, error);
            }
        }

        // Handle product attributes
        if (productDetail.productAttributes?.length) {
            for (const attr of productDetail.productAttributes) {
                try {
                    const attrRecord = await prisma.productAttribute.upsert({
                        where: {
                            productId_attrId: {
                                productId: productDbId,
                                attrId: attr.id!
                            }
                        },
                        create: {
                            productId: productDbId,
                            attrId: attr.id!,
                            name: attr.name!,
                        },
                        update: {
                            name: attr.name!,
                        }
                    });

                    if (attr.values?.length) {
                        for (const val of attr.values) {
                            await prisma.attributeValue.upsert({
                                where: {
                                    productAttributeId_valueId: {
                                        productAttributeId: attrRecord.id,
                                        valueId: val.id!
                                    }
                                },
                                create: {
                                    productAttributeId: attrRecord.id,
                                    valueId: val.id!,
                                    name: val.name!,
                                },
                                update: {
                                    name: val.name!,
                                }
                            });
                        }
                    }
                } catch (error) {
                    console.warn(`⚠️ Failed to handle attribute ${attr.id}:`, error);
                }
            }
            console.log(`🏗️ Processed ${productDetail.productAttributes.length} attributes`);
        }

        // Handle package dimensions and weight
        if (productDetail.packageDimensions) {
            try {
                await prisma.packageDimension.upsert({
                    where: { productId: productDbId },
                    create: {
                        productId: productDbId,
                        height: productDetail.packageDimensions.height!,
                        length: productDetail.packageDimensions.length!,
                        width: productDetail.packageDimensions.width!,
                        unit: productDetail.packageDimensions.unit!,
                    },
                    update: {
                        height: productDetail.packageDimensions.height!,
                        length: productDetail.packageDimensions.length!,
                        width: productDetail.packageDimensions.width!,
                        unit: productDetail.packageDimensions.unit!,
                    }
                });
            } catch (error) {
                console.warn(`⚠️ Failed to create dimensions:`, error);
            }
        }

        if (productDetail.packageWeight) {
            try {
                await prisma.packageWeight.upsert({
                    where: { productId: productDbId },
                    create: {
                        productId: productDbId,
                        value: productDetail.packageWeight.value!,
                        unit: productDetail.packageWeight.unit!,
                    },
                    update: {
                        value: productDetail.packageWeight.value!,
                        unit: productDetail.packageWeight.unit!,
                    }
                });
            } catch (error) {
                console.warn(`⚠️ Failed to create weight:`, error);
            }
        }

        // Handle SKUs, prices, and inventory
        if (productDetail.skus?.length) {
            for (const sku of productDetail.skus) {
                try {
                    // Map extended SKU fields
                    const listPrice = sku.listPrice ?? sku.list_price;
                    const externalListPricesRaw = sku.externalListPrices ?? sku.external_list_prices ?? [];
                    const preSale = sku.preSale ?? sku.pre_sale;
                    const fulfillmentType = preSale?.fulfillmentType ?? preSale?.fulfillment_type;
                    const statusInfo = sku.statusInfo ?? sku.status_info;

                    const skuRecord = await prisma.sku.upsert({
                        where: { skuId: sku.id! },
                        create: {
                            skuId: sku.id!,
                            productId: productDbId,
                            sellerSku: sku.sellerSku ?? "",
                        },
                        update: {
                            sellerSku: sku.sellerSku ?? "",
                        }
                    });

                    if (sku.price) {
                        await prisma.price.upsert({
                            where: { skuId: skuRecord.id },
                            create: {
                                skuId: skuRecord.id,
                                currency: sku.price.currency!,
                                salePrice: sku.price.salePrice!,
                                taxExclusivePrice: sku.price.taxExclusivePrice!,
                            },
                            update: {
                                currency: sku.price.currency!,
                                salePrice: sku.price.salePrice!,
                                taxExclusivePrice: sku.price.taxExclusivePrice!,
                            }
                        });
                    }

                    if (sku.inventory?.length) {
                        for (const inv of sku.inventory) {
                            await prisma.inventory.upsert({
                                where: {
                                    skuId_warehouseId: {
                                        skuId: skuRecord.id,
                                        warehouseId: inv.warehouseId!,
                                    }
                                },
                                create: {
                                    skuId: skuRecord.id,
                                    quantity: inv.quantity!,
                                    warehouseId: inv.warehouseId!,
                                },
                                update: {
                                    quantity: inv.quantity!,
                                }
                            });
                        }
                    }
                } catch (error) {
                    console.warn(`⚠️ Failed to handle SKU ${sku.id}:`, error);
                }
            }
            console.log(`🛍️ Processed ${productDetail.skus.length} SKUs`);
        }

    } catch (error) {
        console.error(`❌ Error handling related data:`, error);
    }
}