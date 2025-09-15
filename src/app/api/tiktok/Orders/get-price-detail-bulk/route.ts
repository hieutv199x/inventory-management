import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { TikTokShopNodeApiClient } from "@/nodejs_sdk";
import { getUserWithShopAccess } from "@/lib/auth";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
    try {
        const { user, accessibleShopIds, isAdmin } = await getUserWithShopAccess(req, prisma);

        const {
            shop_id,
            order_ids = [],
            update_existing_orders = false // Whether to update existing orders with price details
        } = await req.json();

        if (!shop_id || !order_ids || order_ids.length === 0) {
            return NextResponse.json(
                { error: "Missing required fields: shop_id and order_ids" },
                { status: 400 }
            );
        }

        // Check user access
        if (!isAdmin && !accessibleShopIds.includes(shop_id)) {
            return NextResponse.json(
                { error: "Access denied" },
                { status: 403 }
            );
        }

        // Get shop credentials
        const credentials = await prisma.shopAuthorization.findUnique({
            where: {
                id: shop_id,
                status: 'ACTIVE',
            },
            include: { app: true },
        });

        if (!credentials || credentials.app?.channel !== 'TIKTOK') {
            return NextResponse.json({ error: "Invalid TikTok shop" }, { status: 404 });
        }

        // Extract shopCipher
        let shopCipher: string | undefined = credentials.shopCipher ?? undefined;
        if (credentials.channelData) {
            try {
                const channelData = JSON.parse(credentials.channelData);
                shopCipher = channelData.shopCipher ?? shopCipher ?? undefined;
            } catch (error) {
                console.warn('Failed to parse channelData');
            }
        }

        const baseUrl = credentials.app.BaseUrl ?? process.env.TIKTOK_BASE_URL;

        const client = new TikTokShopNodeApiClient({
            config: {
                basePath: baseUrl,
                app_key: credentials.app.appKey,
                app_secret: credentials.app.appSecret,
            },
        });

        type PriceDetail = {
            order_id: any;
            data: any; // You can use Order202407GetPriceDetailResponseData if imported
        };
        type ErrorDetail = {
            order_id: any;
            error: string;
        };
        const results: {
            total_requested: number;
            successful: number;
            failed: number;
            price_details: PriceDetail[];
            errors: ErrorDetail[];
            orders_updated: number;
        } = {
            total_requested: order_ids.length,
            successful: 0,
            failed: 0,
            price_details: [],
            errors: [],
            orders_updated: 0
        };

        // Process each order ID
        for (const orderId of order_ids) {
            try {
                console.log(`Fetching price details for order: ${orderId}`);
                
                const result = await client.api.OrderV202407Api.OrdersOrderIdPriceDetailGet(
                    orderId,
                    credentials.accessToken,
                    "application/json",
                    shopCipher
                );

                if (result?.body?.data) {
                    results.successful++;
                    results.price_details.push({
                        order_id: orderId,
                        data: result.body.data
                    });

                    // Update existing order if requested
                    if (update_existing_orders) {
                        try {
                            const existingOrder = await prisma.order.findFirst({
                                where: {
                                    orderId: orderId,
                                    shopId: credentials.id
                                }
                            });

                            if (existingOrder) {
                                // Parse existing channelData and add price details
                                let channelData = {};
                                try {
                                    channelData = JSON.parse(existingOrder.channelData || '{}');
                                } catch (error) {
                                    console.warn('Failed to parse existing channelData');
                                }

                                channelData = {
                                    ...channelData,
                                    priceDetails: result.body.data,
                                    priceDetailsFetchedAt: Date.now(),
                                    apiVersion: '202407'
                                };

                                await prisma.order.update({
                                    where: { id: existingOrder.id },
                                    data: {
                                        channelData: JSON.stringify(channelData)
                                    }
                                });

                                // Also update the payment record with detailed pricing
                                const existingPayment = await prisma.orderPayment.findUnique({
                                    where: { orderId: existingOrder.id }
                                });

                                if (existingPayment) {
                                    let paymentChannelData = {};
                                    try {
                                        paymentChannelData = JSON.parse(existingPayment.channelData || '{}');
                                    } catch (error) {
                                        console.warn('Failed to parse payment channelData');
                                    }

                                    paymentChannelData = {
                                        ...paymentChannelData,
                                        detailedPricing: result.body.data,
                                    };

                                    await prisma.orderPayment.update({
                                        where: { id: existingPayment.id },
                                        data: {
                                            channelData: JSON.stringify(paymentChannelData)
                                        }
                                    });
                                }

                                results.orders_updated++;
                            }
                        } catch (updateError) {
                            console.error(`Failed to update order ${orderId}:`, updateError);
                        }
                    }
                } else {
                    results.failed++;
                    results.errors.push({
                        order_id: orderId,
                        error: "No price data returned"
                    });
                }

                // Rate limiting delay
                await new Promise(resolve => setTimeout(resolve, 100));

            } catch (error) {
                console.error(`Error fetching price details for order ${orderId}:`, error);
                results.failed++;
                results.errors.push({
                    order_id: orderId,
                    error: typeof error === "object" && error !== null && "message" in error ? (error as { message: string }).message : String(error)
                });
            }
        }

        return NextResponse.json({
            success: true,
            shop_id,
            results
        });

    } catch (err: any) {
        console.error("Error fetching price details:", err);
        return NextResponse.json({ 
            error: err.message || "Internal error" 
        }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}
