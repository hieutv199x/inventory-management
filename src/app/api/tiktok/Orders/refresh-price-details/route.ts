import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getUserWithShopAccess } from "@/lib/auth";
import { refreshPriceDetailsForOrders } from "@/lib/tiktok-order-sync";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
    try {
        const { user, accessibleShopIds, isAdmin } = await getUserWithShopAccess(req, prisma);

        const {
            shop_id,
            order_ids = []
        } = await req.json();

        // Enhanced validation with better error messages
        if (!shop_id) {
            return NextResponse.json(
                { 
                    error: "Missing shop_id",
                    message: "Please provide a valid shop_id in the request body"
                }, 
                { status: 400 }
            );
        }

        if (!order_ids || !Array.isArray(order_ids) || order_ids.length === 0) {
            return NextResponse.json(
                { 
                    error: "Missing or invalid order_ids",
                    message: "Please provide an array of order IDs in the request body. Example: [\"576785229095672600\"]"
                },
                { status: 400 }
            );
        }

        // Check user access
        if (!isAdmin && !accessibleShopIds.includes(shop_id)) {
            return NextResponse.json(
                { 
                    error: "Access denied",
                    message: `User does not have access to shop ${shop_id}`
                }, 
                { status: 403 }
            );
        }

        console.log(`Refreshing price details for ${order_ids.length} orders in shop ${shop_id}`);
        console.log(`Order IDs: ${order_ids.join(', ')}`);

        const startTime = Date.now();
        const result = await refreshPriceDetailsForOrders(shop_id, order_ids);
        const executionTime = Date.now() - startTime;

        return NextResponse.json({
            success: result.success,
            shop_id,
            processed: result.processedCount,
            successful: result.successCount,
            failed: result.errors.length,
            errors: result.errors,
            execution_time_ms: executionTime,
            summary: `Successfully refreshed ${result.successCount}/${result.processedCount} orders in ${executionTime}ms`
        });

    } catch (err: any) {
        console.error("Error refreshing price details:", err);
        return NextResponse.json({ 
            error: err.message || "Internal error",
            message: "An unexpected error occurred while refreshing price details",
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}
