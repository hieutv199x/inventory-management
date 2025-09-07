import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getUserWithShopAccess } from "@/lib/auth";
import { TikTokOrderSync, OrderSyncOptions } from "@/lib/tiktok-order-sync";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
    try {
        const { user, accessibleShopIds, isAdmin } = await getUserWithShopAccess(req, prisma);

        const syncOptions: OrderSyncOptions = await req.json();

        if (!syncOptions.shop_id) {
            return NextResponse.json(
                { error: "Missing required field: shop_id" },
                { status: 400 }
            );
        }

        // Check user access to the requested shop
        if (!isAdmin && !accessibleShopIds.includes(syncOptions.shop_id)) {
            return NextResponse.json(
                { error: "Access denied: You don't have permission to access this shop" },
                { status: 403 }
            );
        }

        // Create sync instance and run sync
        const sync = await TikTokOrderSync.create(syncOptions.shop_id);
        const result = await sync.syncOrders({
            ...syncOptions,
            create_notifications: true // Always create notifications for manual syncs
        });

        if (result.success) {
            return NextResponse.json(result);
        } else {
            return NextResponse.json(
                { error: result.error, ...result },
                { status: 500 }
            );
        }

    } catch (err: any) {
        console.error("Error in sync order route:", err);
        return NextResponse.json({ 
            error: err.message || "Internal error",
            details: err.stack 
        }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}