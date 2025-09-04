import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getUserWithShopAccess, validateShopAccess, getActiveShopIds } from "@/lib/auth";

const prisma = new PrismaClient();

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ orderId: string }> }
) {
    try {
        const { user, accessibleShopIds, isAdmin } = await getUserWithShopAccess(req, prisma);
        const activeShopIds = await getActiveShopIds(prisma);

        // Await params before accessing properties
        const { orderId } = await params;

        if (!orderId) {
            return NextResponse.json(
                { error: "Order ID is required" },
                { status: 400 }
            );
        }

        // First, find the order to check shop access
        const orderCheck = await prisma.order.findUnique({
            where: { orderId },
            select: { shopId: true }
        });

        if (!orderCheck) {
            return NextResponse.json(
                { error: "Order not found" },
                { status: 404 }
            );
        }

        // Only validate shop access for non-admin users
        if (!isAdmin) {
            // Check if user has access to this shop
            if (!accessibleShopIds.includes(orderCheck.shopId)) {
                return NextResponse.json(
                    { error: "Access denied: You don't have permission to access this order" },
                    { status: 403 }
                );
            }

            // Check if shop is active (only for non-admin users)
            if (!activeShopIds.includes(orderCheck.shopId)) {
                return NextResponse.json(
                    { error: "Order not found or shop is inactive" },
                    { status: 404 }
                );
            }
        }
        // For admin users, skip all shop access and active checks

        // Fetch all order data fields for detailed view
        const order = await prisma.order.findUnique({
            where: { orderId },
            include: {
                lineItems: {
                    select: {
                        id: true,
                        lineItemId: true,
                        productId: true,
                        productName: true,
                        skuId: true,
                        skuName: true,
                        sellerSku: true,
                        currency: true,
                        originalPrice: true,
                        salePrice: true,
                        channelData: true, // TikTok-specific data as JSON
                        createdAt: true,
                        updatedAt: true,
                    }
                },
                payment: {
                    select: {
                        id: true,
                        currency: true,
                        totalAmount: true,
                        subTotal: true,
                        tax: true,
                        channelData: true, // TikTok-specific payment data as JSON
                        createdAt: true,
                        updatedAt: true,
                    }
                },
                recipientAddress: {
                    include: {
                        districtInfo: {
                            select: {
                                id: true,
                                addressLevel: true,
                                addressLevelName: true,
                                addressName: true,
                                createdAt: true,
                                updatedAt: true,
                            }
                        }
                    }
                },
                packages: {
                    select: {
                        id: true,
                        packageId: true,
                        channelData: true, // TikTok-specific package data as JSON
                        createdAt: true,
                        updatedAt: true,
                    }
                },
                shop: {
                    select: {
                        id: true,
                        shopId: true,
                        shopName: true,
                        channelData: true, // Contains shopCipher and region
                        accessToken: true,
                        refreshToken: true,
                        status: true,
                        createdAt: true,
                        updatedAt: true,
                        app: {
                            select: {
                                id: true,
                                appName: true,
                                appKey: true,
                                channel: true,
                                isActive: true,
                            }
                        }
                    }
                }
            }
        });

        if (!order) {
            return NextResponse.json(
                { error: "Order not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({ order });

    } catch (err: any) {
        console.error("Error fetching order details:", err);
        if (err.message === 'Authentication required' || err.message === 'User not found') {
            return NextResponse.json({ error: err.message }, { status: 401 });
        }
        return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}

