import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getUserWithShopAccess } from "@/lib/auth";
import { syncUnsettledTransactions } from "@/lib/tiktok-unsettled-transactions-sync";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
    try {
        const { user, accessibleShopIds, isAdmin } = await getUserWithShopAccess(req, prisma);

        const {
            shop_id,
            search_time_ge,
            search_time_lt,
            page_size = 50
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

        // Use the reusable sync function
        const result = await syncUnsettledTransactions(prisma, {
            shop_id,
            search_time_ge,
            search_time_lt,
            page_size
        });

        return NextResponse.json(result);

    } catch (err: any) {
        console.error("Error syncing unsettled transactions:", err);
        return NextResponse.json({ 
            error: err.message || "Internal error",
            message: "An unexpected error occurred while syncing unsettled transactions",
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}