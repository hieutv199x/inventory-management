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
        const sync = body.sync || false;

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
                    credentials.shopCipher,
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

        if (sync) {
            console.log(`Total products to sync: ${allProducts.length}`);
            const createdCount = await syncProductsToDatabase(allProducts, shop_id, client, credentials);
            
            return NextResponse.json({
                ...result.body,
                syncInfo: {
                    totalProductsProcessed: allProducts.length,
                    totalProductsCreated: createdCount,
                    pagesProcessed: Math.ceil(allProducts.length / page_size)
                }
            });
        }

        return NextResponse.json(result.body);
    } catch (err: any) {
        console.error('Sync failed:', err);
        return NextResponse.json({ error: err.message || 'Unknown error' }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}

async function syncProductsToDatabase(products: any[], shopId: string, client: any, credentials: any) {
    const BATCH_SIZE = 20; // Smaller batch size for products due to detail fetching
    let totalCreated = 0;

    console.log(`Starting sync of ${products.length} products in batches of ${BATCH_SIZE}`);

    // Process products in batches
    for (let i = 0; i < products.length; i += BATCH_SIZE) {
        const batch = products.slice(i, i + BATCH_SIZE);
        const batchCreated = await processProductBatch(batch, shopId, client, credentials);
        totalCreated += batchCreated;
        console.log(`Processed ${Math.min(i + BATCH_SIZE, products.length)} of ${products.length} products. Created: ${batchCreated}`);
    }

    console.log(`Product sync completed. Total created: ${totalCreated}`);
    return totalCreated;
}

async function processProductBatch(products: any[], shopId: string, client: any, credentials: any) {
    let createdCount = 0;

    try {
        // Fetch detailed product information for all products in batch
        // Define ProductDetail type if not imported
        type ProductDetail = any; // Replace 'any' with the actual type if available
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
                    credentials.shopCipher
                );

                if (result.body.code === 0 && result.body.data) {
                    productDetails.push(result.body.data);
                }

                // Add delay between detail requests
                await new Promise(resolve => setTimeout(resolve, 50));
            } catch (error) {
                console.error(`Error fetching product detail for ${product.id}:`, error);
            }
        }

        // Process all product details in a single transaction
        if (productDetails.length > 0) {
            createdCount = await prisma.$transaction(async (tx) => {
                let batchCreatedCount = 0;

                for (const productDetail of productDetails) {
                    try {
                        const productId = productDetail.id;
                        
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
                        }

                        // Handle audit
                        let auditRecord = null;
                        if (productDetail.audit) {
                            auditRecord = await tx.audit.create({
                                data: {
                                    status: productDetail.audit.status!,
                                    preApprovedReasons: productDetail.audit.preApprovedReasons ?? [],
                                },
                            });
                        }

                        // Create main product
                        const productRecord = await tx.product.create({
                            data: {
                                productId,
                                shopId: shopId,
                                title: productDetail.title ?? "",
                                description: productDetail.description ?? "",
                                status: productDetail.status ?? "",
                                isNotForSale: productDetail.isNotForSale ?? false,
                                isCodAllowed: productDetail.isCodAllowed ?? false,
                                isPreOwned: productDetail.isPreOwned ?? false,
                                createTime: productDetail.createTime ?? 0,
                                updateTime: productDetail.updateTime ?? 0,
                                shippingInsuranceRequirement: productDetail.shippingInsuranceRequirement ?? "",
                                brandId: brandRecord?.id ?? null,
                                auditId: auditRecord?.id ?? null,
                            }
                        });

                        const productDbId = productRecord.id;

                        // Batch create images
                        if (productDetail.mainImages?.length) {
                            const imageData = productDetail.mainImages.map((img: any) => ({
                                productId: productDbId,
                                uri: img.uri!,
                                width: img.width ?? 0,
                                height: img.height ?? 0,
                                urls: img.urls ?? [],
                                thumbUrls: img.thumbUrls ?? [],
                            }));
                            
                            await tx.productImage.createMany({
                                data: imageData,
                            });
                        }

                        // Batch create category chains
                        if (productDetail.categoryChains?.length) {
                            const categoryData = productDetail.categoryChains.map((cat: any) => ({
                                productId: productDbId,
                                categoryId: cat.id!,
                                localName: cat.localName!,
                                parentId: cat.parentId!,
                                isLeaf: cat.isLeaf ?? false,
                            }));
                            
                            await tx.categoryChain.createMany({
                                data: categoryData,
                            });
                        }

                        // Handle product attributes
                        if (productDetail.productAttributes?.length) {
                            for (const attr of productDetail.productAttributes) {
                                const attrRecord = await tx.productAttribute.create({
                                    data: {
                                        productId: productDbId,
                                        attrId: attr.id!,
                                        name: attr.name!,
                                    },
                                });

                                if (attr.values?.length) {
                                    const valueData = attr.values.map((val: any) => ({
                                        productAttributeId: attrRecord.id,
                                        valueId: val.id!,
                                        name: val.name!,
                                    }));
                                    
                                    await tx.attributeValue.createMany({
                                        data: valueData
                                    });
                                }
                            }
                        }

                        // Handle package dimensions and weight
                        if (productDetail.packageDimensions) {
                            await tx.packageDimension.create({
                                data: {
                                    productId: productDbId,
                                    height: productDetail.packageDimensions.height!,
                                    length: productDetail.packageDimensions.length!,
                                    width: productDetail.packageDimensions.width!,
                                    unit: productDetail.packageDimensions.unit!,
                                },
                            });
                        }

                        if (productDetail.packageWeight) {
                            await tx.packageWeight.create({
                                data: {
                                    productId: productDbId,
                                    value: productDetail.packageWeight.value!,
                                    unit: productDetail.packageWeight.unit!,
                                },
                            });
                        }

                        // Handle SKUs, prices, and inventory
                        if (productDetail.skus?.length) {
                            for (const sku of productDetail.skus) {
                                const skuRecord = await tx.sku.create({
                                    data: {
                                        skuId: sku.id!,
                                        productId: productDbId,
                                        sellerSku: sku.sellerSku ?? "",
                                    },
                                });

                                if (sku.price) {
                                    await tx.price.create({
                                        data: {
                                            skuId: skuRecord.id,
                                            currency: sku.price.currency!,
                                            salePrice: sku.price.salePrice!,
                                            taxExclusivePrice: sku.price.taxExclusivePrice!,
                                        },
                                    });
                                }

                                if (sku.inventory?.length) {
                                    const inventoryData = sku.inventory.map((inv: any) => ({
                                        skuId: skuRecord.id,
                                        quantity: inv.quantity!,
                                        warehouseId: inv.warehouseId!,
                                    }));
                                    
                                    await tx.inventory.createMany({
                                        data: inventoryData,
                                    });
                                }
                            }
                        }

                        batchCreatedCount++;
                    } catch (error) {
                        console.error(`Error creating product ${productDetail.id}:`, error);
                    }
                }

                return batchCreatedCount;
            }, {
                maxWait: 30000,
                timeout: 60000,
            });
        }
    } catch (error) {
        console.error('Error processing product batch:', error);
    }

    return createdCount;
}