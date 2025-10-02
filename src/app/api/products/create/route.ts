import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserWithShopAccess } from '@/lib/auth';

const prisma = new PrismaClient();

interface CreateProductRequest {
    title: string;
    description: string;
    brandId?: string;
    categoryId: string;
    categoryVersion?: string;
    mainImages: Array<{
        uri: string;
        width: number;
        height: number;
    }>;
    skus: Array<{
        sellerSku: string;
        price: {
            currency: string;
            salePrice: string;
            taxExclusivePrice: string;
        };
        inventory: Array<{
            warehouseId: string;
            quantity: number;
        }>;
    }>;
    productAttributes?: Array<{
        attrId: string;
        name: string;
        values: Array<{
            valueId: string;
            name: string;
        }>;
    }>;
    packageDimensions?: {
        height: string;
        length: string;
        width: string;
        unit: string;
    };
    packageWeight?: {
        value: string;
        unit: string;
    };
    isNotForSale?: boolean;
    isCodAllowed?: boolean;
    isPreOwned?: boolean;
}

export async function POST(req: NextRequest) {
    try {
        const { user } = await getUserWithShopAccess(req, prisma);
        const body: CreateProductRequest = await req.json();

        // Generate unique productId
        const productId = `LOCAL_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Create product in database
        const createdProduct = await prisma.product.create({
            data: {
                productId,
                channel: 'TIKTOK',
                title: body.title,
                description: body.description,
                status: 'DRAFT', // Initially as draft
                createTime: Math.floor(Date.now() / 1000),
                updateTime: Math.floor(Date.now() / 1000),
                channelData: JSON.stringify({
                    isNotForSale: body.isNotForSale ?? false,
                    isCodAllowed: body.isCodAllowed ?? false,
                    isPreOwned: body.isPreOwned ?? false,
                    categoryId: body.categoryId,
                    categoryVersion: body.categoryVersion ?? 'v1'
                })
            }
        });

        // Handle brand if provided
        if (body.brandId) {
            const brand = await prisma.brand.findUnique({
                where: { brandId: body.brandId }
            });
            if (brand) {
                await prisma.product.update({
                    where: { id: createdProduct.id },
                    data: { brandId: brand.id }
                });
            }
        }

        // Handle images
        if (body.mainImages?.length > 0) {
            await prisma.productImage.createMany({
                data: body.mainImages.map((img, index) => ({
                    productId: createdProduct.id,
                    uri: img.uri,
                    width: img.width || 0,
                    height: img.height || 0,
                    urls: [],
                    thumbUrls: []
                }))
            });
        }

        // Handle SKUs
        if (body.skus?.length > 0) {
            for (const skuData of body.skus) {
                const sku = await prisma.sku.create({
                    data: {
                        skuId: `${productId}_${skuData.sellerSku}`,
                        productId: createdProduct.id,
                        sellerSku: skuData.sellerSku
                    }
                });

                // Create price
                if (skuData.price) {
                    await prisma.price.create({
                        data: {
                            skuId: sku.id,
                            currency: skuData.price.currency,
                            salePrice: skuData.price.salePrice,
                            taxExclusivePrice: skuData.price.taxExclusivePrice
                        }
                    });
                }

                // Create inventory
                if (skuData.inventory?.length > 0) {
                    await prisma.inventory.createMany({
                        data: skuData.inventory.map(inv => ({
                            skuId: sku.id,
                            quantity: inv.quantity,
                            warehouseId: inv.warehouseId
                        }))
                    });
                }
            }
        }

        // Handle product attributes
        if (body.productAttributes && body.productAttributes.length > 0) {
            for (const attr of body.productAttributes) {
                const productAttr = await prisma.productAttribute.create({
                    data: {
                        productId: createdProduct.id,
                        attrId: attr.attrId,
                        name: attr.name
                    }
                });

                if (attr.values?.length > 0) {
                    await prisma.attributeValue.createMany({
                        data: attr.values.map(val => ({
                            productAttributeId: productAttr.id,
                            valueId: val.valueId,
                            name: val.name
                        }))
                    });
                }
            }
        }

        // Handle package dimensions
        if (body.packageDimensions) {
            await prisma.packageDimension.create({
                data: {
                    productId: createdProduct.id,
                    height: body.packageDimensions.height,
                    length: body.packageDimensions.length,
                    width: body.packageDimensions.width,
                    unit: body.packageDimensions.unit
                }
            });
        }

        // Handle package weight
        if (body.packageWeight) {
            await prisma.packageWeight.create({
                data: {
                    productId: createdProduct.id,
                    value: body.packageWeight.value,
                    unit: body.packageWeight.unit
                }
            });
        }

        // Fetch complete product with relations
        const completeProduct = await prisma.product.findUnique({
            where: { id: createdProduct.id },
            include: {
                shop: true,
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

        return NextResponse.json({
            success: true,
            product: completeProduct,
            message: 'Product created successfully'
        });

    } catch (error) {
        console.error('Create product error:', error);
        return NextResponse.json(
            { error: 'Failed to create product' },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}