import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getUserWithShopAccess, getActiveShopIds } from "@/lib/auth";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
    try {
        const { user, accessibleShopIds, isAdmin } = await getUserWithShopAccess(req, prisma);
        const activeShopIds = await getActiveShopIds(prisma);

        // Extract query parameters
        const { searchParams } = new URL(req.url);
        const shopId = searchParams.get('shopId');
        const status = searchParams.get('status');
        const keyword = searchParams.get('keyword');
        const createTimeGe = searchParams.get('createTimeGe');
        const createTimeLt = searchParams.get('createTimeLt');
        
        // Pagination parameters
        const page = parseInt(searchParams.get('page') || '1', 10);
        const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);
        const offset = (page - 1) * pageSize;

        // Build where condition
        let whereCondition: any = {};

        // Shop access control
        let allowedShopObjectIds: string[] = [];
        
        if (!isAdmin) {
            // For non-admin users, get ObjectIDs of accessible shops
            const accessibleShops = await prisma.shopAuthorization.findMany({
                where: {
                    shopId: { in: accessibleShopIds.filter(id => activeShopIds.includes(id)) }
                },
                select: { id: true }
            });
            allowedShopObjectIds = accessibleShops.map(shop => shop.id);
        } else {
            // For admin users, get all active shops unless specific shop is requested
            if (!shopId) {
                const activeShops = await prisma.shopAuthorization.findMany({
                    where: { shopId: { in: activeShopIds } },
                    select: { id: true }
                });
                allowedShopObjectIds = activeShops.map(shop => shop.id);
            }
        }

        // Apply shop filter
        if (shopId) {
            // Find the ObjectID for the specific shopId
            const targetShop = await prisma.shopAuthorization.findUnique({
                where: { shopId: shopId },
                select: { id: true }
            });
            
            if (!targetShop) {
                return NextResponse.json({
                    orders: [],
                    pagination: {
                        currentPage: page,
                        pageSize,
                        totalItems: 0,
                        totalPages: 0,
                        hasNextPage: false,
                        hasPreviousPage: false
                    }
                });
            }
            
            whereCondition.shopId = targetShop.id;
        } else if (allowedShopObjectIds.length > 0) {
            whereCondition.shopId = { in: allowedShopObjectIds };
        } else {
            // No accessible shops, return empty result
            return NextResponse.json({
                orders: [],
                pagination: {
                    currentPage: page,
                    pageSize,
                    totalItems: 0,
                    totalPages: 0,
                    hasNextPage: false,
                    hasPreviousPage: false
                }
            });
        }

        // Apply other filters
        if (status) {
            whereCondition.status = status.toUpperCase();
        }

        if (keyword) {
            whereCondition.OR = [
                { orderId: { contains: keyword, mode: 'insensitive' } },
                { buyerEmail: { contains: keyword, mode: 'insensitive' } },
                { recipientAddress: { name: { contains: keyword, mode: 'insensitive' } } },
                { lineItems: { some: { productName: { contains: keyword, mode: 'insensitive' } } } }
            ];
        }

        if (createTimeGe) {
            whereCondition.createTime = { 
                ...whereCondition.createTime,
                gte: parseInt(createTimeGe) 
            };
        }

        if (createTimeLt) {
            whereCondition.createTime = { 
                ...whereCondition.createTime,
                lt: parseInt(createTimeLt) 
            };
        }

        // Get total count for pagination
        const totalItems = await prisma.order.count({
            where: whereCondition
        });

        // Get paginated orders
        const orders = await prisma.order.findMany({
            where: whereCondition,
            include: {
                shop: {
                    select: {
                        shopName: true,
                        shopId: true
                    }
                },
                lineItems: {
                    select: {
                        id: true,
                        lineItemId: true,
                        productId: true,
                        productName: true,
                        skuId: true,
                        skuName: true,
                        sellerSku: true,
                        salePrice: true,
                        originalPrice: true,
                        currency: true,
                        channelData: true,
                        createdAt: true,
                        updatedAt: true
                    }
                },
                payment: {
                    select: {
                        currency: true,
                        totalAmount: true,
                        subTotal: true,
                        tax: true
                    }
                },
                recipientAddress: {
                    select: {
                        name: true,
                        phoneNumber: true,
                        fullAddress: true
                    }
                }
            },
            orderBy: {
                createTime: 'desc'
            },
            skip: offset,
            take: pageSize
        });

        const totalPages = Math.ceil(totalItems / pageSize);

        // Transform orders to include lineItemsCount
        const transformedOrders = orders.map(order => ({
            ...order,
            lineItemsCount: order.lineItems.length
        }));

        return NextResponse.json({
            orders: transformedOrders,
            pagination: {
                currentPage: page,
                pageSize,
                totalItems,
                totalPages,
                hasNextPage: page < totalPages,
                hasPreviousPage: page > 1
            }
        });

    } catch (err: any) {
        console.error("Error fetching orders:", err);
        if (err.message === 'Authentication required' || err.message === 'User not found') {
            return NextResponse.json({ error: err.message }, { status: 401 });
        }
        return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}