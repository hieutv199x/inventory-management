import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getUserWithShopAccess } from "@/lib/auth";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
    try {
        const { user, accessibleShopIds, isAdmin } = await getUserWithShopAccess(req, prisma);

        const {
            shop_id,
            hours_back = 24, // How many hours back to sync
            include_price_details = true,
            force_update = false // Whether to update existing orders
        } = await req.json();

        if (!shop_id) {
            return NextResponse.json(
                { error: "Missing required field: shop_id" },
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

        // Calculate time range
        const now = Math.floor(Date.now() / 1000);
        const hoursBackSeconds = hours_back * 60 * 60;
        const update_time_ge = now - hoursBackSeconds;

        console.log(`Syncing orders from last ${hours_back} hours for shop ${shop_id}`);
        console.log(`Time range: ${update_time_ge} to ${now} (${new Date(update_time_ge * 1000).toISOString()} to ${new Date(now * 1000).toISOString()})`);

        // Call the main sync API
        const syncResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/tiktok/Orders/sync-order-detail-v202507`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Forward authorization headers
                ...req.headers
            },
            body: JSON.stringify({
                shop_id,
                sync_all: true,
                update_time_ge,
                update_time_lt: now,
                page_size: 50,
                include_price_detail: include_price_details
            })
        });

        if (!syncResponse.ok) {
            const error = await syncResponse.json();
            throw new Error(error.error || 'Failed to sync orders');
        }

        const syncResult = await syncResponse.json();

        return NextResponse.json({
            success: true,
            message: `Successfully synced orders from last ${hours_back} hours`,
            shop_id,
            time_range: {
                from: new Date(update_time_ge * 1000).toISOString(),
                to: new Date(now * 1000).toISOString(),
                hours_back
            },
            ...syncResult
        });

    } catch (err: any) {
        console.error("Error syncing recent orders:", err);
        return NextResponse.json({ 
            error: err.message || "Internal error" 
        }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}
