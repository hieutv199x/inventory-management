import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getUserWithShopAccess, validateShopAccess, getActiveShopIds } from "@/lib/auth";

const prisma = new PrismaClient();

export async function GET(
    req: NextRequest,
    { params }: { params: { orderId: string } }
) {
    try {
        const { user, accessibleShopIds, isAdmin } = await getUserWithShopAccess(req, prisma);
        const activeShopIds = await getActiveShopIds(prisma);

        const { orderId } = params;

        if (!orderId) {
            return NextResponse.json(
                { error: "Order ID is required" },
                { status: 400 }
            );
        }

        // First, find the order to check shop access
        const orderCheck = await prisma.tikTokOrder.findUnique({
            where: { orderId },
            select: { shopId: true }
        });

        if (!orderCheck) {
            return NextResponse.json(
                { error: "Order not found" },
                { status: 404 }
            );
        }

        // Validate shop access
        if (!isAdmin && !accessibleShopIds.includes(orderCheck.shopId)) {
            return NextResponse.json(
                { error: "Access denied: You don't have permission to access this order" },
                { status: 403 }
            );
        }

        // Check if shop is active
        if (!activeShopIds.includes(orderCheck.shopId)) {
            return NextResponse.json(
                { error: "Order not found or shop is inactive" },
                { status: 404 }
            );
        }

        // Fetch all order data fields for detailed view
        const order = await prisma.tikTokOrder.findUnique({
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
                        skuType: true,
                        sellerSku: true,
                        skuImage: true,
                        currency: true,
                        originalPrice: true,
                        salePrice: true,
                        sellerDiscount: true,
                        platformDiscount: true,
                        displayStatus: true,
                        isGift: true,
                        packageId: true,
                        packageStatus: true,
                        shippingProviderId: true,
                        shippingProviderName: true,
                        trackingNumber: true,
                        rtsTime: true,
                        createdAt: true,
                        updatedAt: true,
                    }
                },
                payment: {
                    select: {
                        id: true,
                        currency: true,
                        originalTotalProductPrice: true,
                        originalShippingFee: true,
                        subTotal: true,
                        totalAmount: true,
                        tax: true,
                        sellerDiscount: true,
                        platformDiscount: true,
                        shippingFee: true,
                        shippingFeeCofundedDiscount: true,
                        shippingFeePlatformDiscount: true,
                        shippingFeeSellerDiscount: true,
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
                        createdAt: true,
                        updatedAt: true,
                    }
                },
                shop: {
                    select: {
                        id: true,
                        shopId: true,
                        shopName: true,
                        shopCipher: true,
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
