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
        const result = await client.api.ProductV202502Api.ProductsSearchPost(
            page_size,
            credentials.accessToken,
            'application/json',
            "",
            credentials.shopCipher,
            searchBody
        );

        const products = result.body?.data?.products || [];
        for (const product of products) {
            const productId = product.id!;
            const result = await client.api.ProductV202309Api.ProductsProductIdGet(productId, credentials.accessToken, "application/json", false, credentials.shopCipher);
            console.log('response: ', JSON.stringify(result, null, 2));
            if(result.body.code != 0){
                //Lỗi
            }
            const productDetail = result.body.data;
            if (!productDetail) continue;
            const brand = productDetail.brand;
            const audit = productDetail.audit;
            // Tạo hoặc cập nhật Brand
            let brandRecord = null;
            if (brand?.id) {
                brandRecord = await prisma.brand.upsert({
                    where: { brandId: brand.id },
                    create: {
                        brandId: brand.id,
                        name: brand.name!,
                    },
                    update: {
                        name: brand.name,
                    },
                });
            }

            // Tạo hoặc cập nhật Audit
            let auditRecord = null;
            if (audit) {
                auditRecord = await prisma.audit.create({
                    data: {
                        status: audit.status!,
                        preApprovedReasons: audit.preApprovedReasons ?? [],
                    },
                });
            }

            const productRecord = await prisma.product.upsert({
                where: { productId: productId },
                create: {
                    productId,
                    shopId: shop_id,
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
                },
                update: {
                    title: productDetail.title ?? "",
                    description: productDetail.description ?? "",
                    status: productDetail.status ?? "",
                    isNotForSale: productDetail.isNotForSale ?? false,
                    isCodAllowed: productDetail.isCodAllowed ?? false,
                    isPreOwned: productDetail.isPreOwned ?? false,
                    updateTime: productDetail.updateTime ?? 0,
                    shippingInsuranceRequirement: productDetail.shippingInsuranceRequirement ?? "",
                    brandId: brandRecord?.id ?? null,
                    auditId: auditRecord?.id ?? null,
                },
            });

            const productDbId = productRecord.id;

            // Lưu hình ảnh
            if (productDetail.mainImages?.length) {
                await prisma.productImage.deleteMany({ where: { productId: productDbId } });
                for (const img of productDetail.mainImages ?? []) {
                    await prisma.productImage.upsert({
                    where: {
                        productId_uri: {
                        productId: productDbId,
                        uri: img.uri!,
                        },
                    },
                    create: {
                        productId: productDbId,
                        uri: img.uri!,
                        width: img.width ?? 0,
                        height: img.height ?? 0,
                        urls: img.urls ?? [],
                        thumbUrls: img.thumbUrls ?? [],
                    },
                    update: {
                        width: img.width ?? 0,
                        height: img.height ?? 0,
                        urls: img.urls ?? [],
                        thumbUrls: img.thumbUrls ?? [],
                    },
                    });
                }
            }

            await prisma.categoryChain.deleteMany({ where: { productId: productDbId } });
            for (const cat of productDetail.categoryChains ?? []) {
                await prisma.categoryChain.upsert({
                where: {
                    productId_categoryId: {
                    productId: productDbId,
                    categoryId: cat.id!,
                    },
                },
                create: {
                    productId: productDbId,
                    categoryId: cat.id!,
                    localName: cat.localName!,
                    parentId: cat.parentId!,
                    isLeaf: cat.isLeaf ?? false,
                },
                update: {
                    localName: cat.localName!,
                    parentId: cat.parentId!,
                    isLeaf: cat.isLeaf ?? false,
                },
                });
            }
            // Lưu attributes
            if (productDetail.productAttributes?.length) {
                // Lấy tất cả id của productAttribute cần xóa
                const productAttributes = await prisma.productAttribute.findMany({
                    where: { productId: productDbId },
                    select: { id: true }
                });
                const productAttributeIds = productAttributes.map(attr => attr.id);

                // Xóa tất cả attributeValue liên quan
                if (productAttributeIds.length > 0) {
                    await prisma.attributeValue.deleteMany({
                        where: {
                            productAttributeId: { in: productAttributeIds }
                        }
                    });
                }

                // Sau đó xóa productAttribute
                await prisma.productAttribute.deleteMany({ where: { productId: productDbId } });

                for (const attr of productDetail.productAttributes ?? []) {
                    const attrRecord = await prisma.productAttribute.upsert({
                        where: {
                            productId_attrId: {
                                productId: productDbId,
                                attrId: attr.id!,
                            },
                        },
                        create: {
                            productId: productDbId,
                            attrId: attr.id!,
                            name: attr.name!,
                        },
                        update: {
                            name: attr.name!,
                        },
                    });

                    for (const val of attr.values ?? []) {
                        await prisma.attributeValue.upsert({
                            where: {
                                productAttributeId_valueId: {
                                    productAttributeId: attrRecord.id,
                                    valueId: val.id!,
                                },
                            },
                            create: {
                                productAttributeId: attrRecord.id,
                                valueId: val.id!,
                                name: val.name!,
                            },
                            update: {
                                name: val.name!,
                            },
                        });
                    }
                }
            }

            // Lưu package dimension và weight
            if (productDetail.packageDimensions) {
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
                  },
                });
              }

              if (productDetail.packageWeight) {
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
                  },
                });
              }

            // Lưu SKU, Price, Inventory
            // Lấy tất cả id của sku cần xóa
            const skuRecords = await prisma.sku.findMany({
                where: { productId: productDbId },
                select: { id: true }
            });
            const skuIds = skuRecords.map(sku => sku.id);

            // Xóa inventory liên quan trước
            if (skuIds.length > 0) {
                await prisma.inventory.deleteMany({
                    where: {
                        skuId: { in: skuIds }
                    }
                });
                // Xóa price liên quan trước
                await prisma.price.deleteMany({
                    where: {
                        skuId: { in: skuIds }
                    }
                });
            }

            // Sau đó xóa sku
            await prisma.sku.deleteMany({ where: { productId: productDbId } });
            for (const sku of productDetail.skus ?? []) {
                const skuRecord = await prisma.sku.upsert({
                where: { skuId: sku.id! },
                create: {
                    skuId: sku.id!,
                    productId: productDbId,
                    sellerSku: sku.sellerSku ?? "",
                },
                update: {
                    productId: productDbId,
                    sellerSku: sku.sellerSku ?? "",
                },
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
                    },
                });
                }

                for (const inv of sku.inventory ?? []) {
                await prisma.inventory.upsert({
                    where: {
                    skuId_warehouseId: {
                        skuId: skuRecord.id,
                        warehouseId: inv.warehouseId!,
                    },
                    },
                    create: {
                    skuId: skuRecord.id,
                    quantity: inv.quantity!,
                    warehouseId: inv.warehouseId!,
                    },
                    update: {
                    quantity: inv.quantity!,
                    },
                });
                }
            }

        }

        return NextResponse.json({ message: 'Synced successfully', count: products.length });
    } catch (err: any) {
        console.error('Sync failed:', err);
        return NextResponse.json({ error: err.message || 'Unknown error' }, { status: 500 });
    }
}