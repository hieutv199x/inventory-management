import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getUserWithShopAccess, validateShopAccess, getActiveShopIds } from "@/lib/auth";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
    try {
        const { user, accessibleShopIds, isAdmin } = await getUserWithShopAccess(req, prisma);
        const activeShopIds = await getActiveShopIds(prisma);

        const {
            shopId,
            createTimeGe,
            createTimeLt,
            status,
            page = 1,
            pageSize = 20,
            fields, // New parameter for field selection
        } = await req.json();

        const where: any = {};

        // Validate shop access
        const { shopFilter, hasAccess } = validateShopAccess(shopId, isAdmin, accessibleShopIds, activeShopIds);
        
        if (!hasAccess) {
            return NextResponse.json({
                orders: [],
                pagination: { total: 0, page: 1, pageSize: 20, totalPages: 0 }
            });
        }

        where.shopId = shopFilter;

        const skip = (page - 1) * pageSize;

        // Determine what to select based on fields parameter
        const selectFields = fields ? {
            id: true,
            orderId: true,
            buyerEmail: true,
            status: true,
            createTime: true,
            trackingNumber: true,
            payment: {
                select: {
                    totalAmount: true,
                    currency: true,
                }
            },
            recipientAddress: {
                select: {
                    name: true,
                    phoneNumber: true,
                }
            },
            shop: {
                select: {
                    shopName: true,
                    shopId: true,
                }
            },
            _count: {
                select: {
                    lineItems: true
                }
            }
        } : {
            // Full selection for detailed view
            id: true,
            orderId: true,
            buyerEmail: true,
            status: true,
            createTime: true,
            updateTime: true,
            trackingNumber: true,
            lineItems: true,
            payment: true,
            recipientAddress: {
                include: {
                    districtInfo: true,
                }
            },
            packages: true,
            shop: {
                select: {
                    id: true,
                    shopName: true,
                    shopId: true,
                }
            }
        };

        const [orders, total] = await Promise.all([
            prisma.tikTokOrder.findMany({
                where,
                select: selectFields,
                orderBy: {
                    createTime: 'desc',
                },
                skip,
                take: pageSize,
            }),
            prisma.tikTokOrder.count({ where }),
        ]);

        // Transform data for field selection response
        const transformedOrders = fields ? orders.map(order => ({
            ...order,
            lineItemsCount: order._count?.lineItems || 0,
            _count: undefined, // Remove the count object from response
        })) : orders;

        return NextResponse.json({
            orders: transformedOrders,
            pagination: {
                total,
                page,
                pageSize,
                totalPages: Math.ceil(total / pageSize),
            }
        });

    } catch (err: any) {
        console.error("Error fetching stored orders:", err);
        if (err.message === 'Authentication required' || err.message === 'User not found') {
            return NextResponse.json({ error: err.message }, { status: 401 });
        }
        return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}