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
                shopId: shop_id,
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
        const baseUrl = process.env.TIKTOK_BASE_URL;

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

    console.log(`🚀 Starting sync of ${products.length} products in batches of ${BATCH_SIZE}`);
    console.log(`🏪 Using shop ObjectId: ${shopObjectId}`);

    // Verify shop exists before starting
    try {
        const shop = await prisma.shopAuthorization.findUnique({
            where: { id: shopObjectId }
        });
        if (!shop) {
            console.error(`❌ Shop with ObjectId ${shopObjectId} not found!`);
            return 0;
        }
        console.log(`✅ Shop found: ${shop.shopName || shop.shopId}`);
    } catch (error) {
        console.error(`❌ Error verifying shop:`, error);
        return 0;
    }

    // Process products in batches
    for (let i = 0; i < products.length; i += BATCH_SIZE) {
        const batch = products.slice(i, i + BATCH_SIZE);
        console.log(`\n📦 Processing batch ${Math.floor(i / BATCH_SIZE) + 1} (products ${i + 1}-${Math.min(i + BATCH_SIZE, products.length)})`);
        
        const batchCreated = await processProductBatch(batch, shopObjectId, client, credentials);
        totalCreated += batchCreated;
        console.log(`📊 Batch ${Math.floor(i / BATCH_SIZE) + 1} completed: ${batchCreated} created. Total so far: ${totalCreated}`);
        
        // Add delay between batches
        await new Promise(resolve => setTimeout(resolve, 200));
    }

    console.log(`🏁 Product sync completed. Total created: ${totalCreated} out of ${products.length}`);
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
                    console.log(`⏭️ Product ${productId} already exists, skipping...`);
                    continue;
                }

                const result = await client.api.ProductV202309Api.ProductsProductIdGet(
                    productId, 
                    credentials.accessToken, 
                    "application/json", 
                    false, 
                    credentials.shopCipher
                );

                if (result.body.code === 0 && result.body.data) {
                    productDetails.push(result.body.data);
                    console.log(`✅ Fetched details for product ${productId}`);
                } else {
                    console.warn(`⚠️ Failed to get details for product ${productId}: ${result.body.message}`);
                }

                // Add delay between detail requests
                await new Promise(resolve => setTimeout(resolve, 50));
            } catch (error) {
                console.error(`❌ Error fetching product detail for ${product.id}:`, error);
            }
        }

        console.log(`📋 Processing ${productDetails.length} product details...`);

        // Process each product individually to avoid large transaction timeouts
        for (const productDetail of productDetails) {
            try {
                const productId = productDetail.id;
                console.log(`\n🔄 Creating product ${productId}...`);

                // Create product in smaller transaction
                const productCreated = await prisma.$transaction(async (tx) => {
                    // Handle brand
                    let brandRecord = null;
                    if (productDetail.brand?.id) {
                        brandRecord = await tx.brand.upsert({
                            where: { brandId: productDetail.brand.id },
                            create: {
                                brandId: productDetail.brand.id,
                                name: productDetail.brand.name!,
                            },
                            update: {
                                name: productDetail.brand.name,
                            },
                        });
                        console.log(`📦 Brand handled: ${brandRecord.id}`);
                    }

                    // Handle audit
                    let auditRecord = null;
                    if (productDetail.audit) {
                        auditRecord = await tx.audit.create({
                            data: {
                                status: productDetail.audit.status!,
                                preApprovedReasons: productDetail.audit.preApprovedReasons ?? [],
                                failedReasons: productDetail.audit.failedReasons ?? [],
                                suggestions: productDetail.audit.suggestions ?? [],
                            },
                        });
                        console.log(`📝 Audit created: ${auditRecord.id}`);
                    }

                    // Create main product with updated schema
                    const productRecord = await tx.product.create({
                        data: {
                            productId,
                            channel: 'TIKTOK', // Add required channel field
                            shopId: shopObjectId, // Use ShopAuthorization ObjectID
                            title: productDetail.title ?? "",
                            description: productDetail.description ?? "",
                            status: productDetail.status ?? "",
                            price: productDetail.skus?.[0]?.price?.salePrice, // Extract price from first SKU
                            currency: productDetail.skus?.[0]?.price?.currency, // Extract currency from first SKU
                            createTime: productDetail.createTime ?? 0,
                            updateTime: productDetail.updateTime ?? 0,
                            // Move TikTok-specific fields to channelData JSON
                            channelData: JSON.stringify({
                                isNotForSale: productDetail.isNotForSale ?? false,
                                isCodAllowed: productDetail.isCodAllowed ?? false,
                                isPreOwned: productDetail.isPreOwned ?? false,
                                shippingInsuranceRequirement: productDetail.shippingInsuranceRequirement ?? "",
                                originalShopId: credentials.shopId
                            }),
                            brandId: brandRecord?.id ?? null,
                            auditId: auditRecord?.id ?? null,
                        }
                    });

                    console.log(`✅ Product created: ${productRecord.id}`);
                    return productRecord;
                }, {
                    maxWait: 15000,
                    timeout: 30000,
                });

                if (productCreated) {
                    // Handle related data in separate operations to avoid large transactions
                    await handleProductRelatedData(productDetail, productCreated.id);
                    createdCount++;
                    console.log(`✅ Product ${productId} completed successfully`);
                }

            } catch (error) {
                console.error(`❌ Error creating product ${productDetail.id}:`, error);
                // Continue with next product instead of failing the entire batch
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
                console.log(`📸 Created ${imageData.length} images`);
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
                console.log(`🏷️ Created ${categoryData.length} categories`);
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
                console.log(`📐 Package dimensions created`);
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
                console.log(`⚖️ Package weight created`);
            } catch (error) {
                console.warn(`⚠️ Failed to create weight:`, error);
            }
        }

        // Handle SKUs, prices, and inventory
        if (productDetail.skus?.length) {
            for (const sku of productDetail.skus) {
                try {
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