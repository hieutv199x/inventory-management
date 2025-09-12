import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { sync_all_shop_orders } from "@/lib/tiktok-order-sync-all-shop";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
    try {
        // Get page size and day_to_sync from query parameters
        const { searchParams } = new URL(req.url);
        const pageSize = parseInt(searchParams.get('pageSize') || '50');
        const dayToSync = parseFloat(searchParams.get('dayToSync') || '1');

        await sync_all_shop_orders(pageSize, dayToSync);
        return NextResponse.json({ success: true, message: "Sync initiated" });
    } catch (err: any) {
        console.error("Error syncing recent orders:", err);
        return NextResponse.json({ 
            error: err.message || "Internal error" 
        }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}
