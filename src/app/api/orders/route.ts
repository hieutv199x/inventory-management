import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getUserWithShopAccess, getActiveShopIds } from "@/lib/auth";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        
        // Extract parameters including customStatus
        const page = parseInt(searchParams.get('page') || '1');
        const pageSize = parseInt(searchParams.get('pageSize') || '20');
        const shopId = searchParams.get('shopId');
        const status = searchParams.get('status');
        const customStatus = searchParams.get('customStatus');
        const keyword = searchParams.get('keyword');
        const createTimeGe = searchParams.get('createTimeGe');
        const createTimeLt = searchParams.get('createTimeLt');

        // Build Prisma where clause
        const whereClause: any = {};
        
        if (shopId) whereClause.shopId = shopId;
        if (status) whereClause.status = status;
        
        // Handle customStatus filter with Prisma syntax
        if (customStatus) {
            if (customStatus === 'NOT_SET') {
                whereClause.OR = [
                    { customStatus: null },
                    { customStatus: '' }
                ];
            } else {
                whereClause.customStatus = customStatus;
            }
        }
        
        // Handle date range filters
        if (createTimeGe || createTimeLt) {
            whereClause.createTime = {};
            if (createTimeGe) whereClause.createTime.gte = parseInt(createTimeGe);
            if (createTimeLt) whereClause.createTime.lt = parseInt(createTimeLt);
        }

        // Handle keyword search with Prisma syntax
        if (keyword) {
            whereClause.OR = [
                { orderId: { contains: keyword, mode: 'insensitive' } },
                { buyerEmail: { contains: keyword, mode: 'insensitive' } },
                { 
                    recipientAddress: {
                        name: { contains: keyword, mode: 'insensitive' }
                    }
                },
                {
                    lineItems: {
                        some: {
                            productName: { contains: keyword, mode: 'insensitive' }
                        }
                    }
                }
            ];
        }

        // Execute Prisma query with customStatus filter
        const [orders, totalCount] = await Promise.all([
            prisma.order.findMany({
                where: whereClause,
                include: {
                    lineItems: true,
                    payment: true,
                    recipientAddress: true,
                    shop: true,
                },
                orderBy: {
                    createTime: 'desc'
                },
                skip: (page - 1) * pageSize,
                take: pageSize
            }),
            prisma.order.count({
                where: whereClause
            })
        ]);

        const totalPages = Math.ceil(totalCount / pageSize);

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
                totalItems: totalCount,
                totalPages,
                hasNextPage: page < totalPages,
                hasPreviousPage: page > 1
            }
        });

    } catch (error) {
        console.error('Error fetching orders:', error);
        return NextResponse.json(
            { error: 'Failed to fetch orders' },
            { status: 500 }
        );
    }
}