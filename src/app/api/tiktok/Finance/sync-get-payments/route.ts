import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { syncPayments } from "@/lib/tiktok-payments-sync";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);

        const statementTimeGe = parseInt(searchParams.get("statementTimeGe") || "0", 10);
        const statementTimeLt = parseInt(searchParams.get("statementTimeLt") || "0", 10);

        if (!statementTimeGe || !statementTimeLt) {
            return NextResponse.json(
                { error: "Missing or invalid statementTimeGe or statementTimeLt" },
                { status: 400 }
            );
        }

        const shops = await prisma.shopAuthorization.findMany({
            where: { 
                status: 'ACTIVE',
                app: { channel: 'TIKTOK' } // Only get TikTok shops
            },
            include: { app: true },
        });

        let totalPaymentsSynced = 0;
        const shopResults = [];

        for (const shop of shops) {
            try {
                // Delegate the original per-shop logic to lib without changing behavior
                const result = await syncPayments(prisma, {
                    shop_id: shop.id, // original route synced per internal ObjectId
                    search_time_ge: statementTimeGe,
                    search_time_lt: statementTimeLt,
                    page_size: 50,
                });

                totalPaymentsSynced += result.paymentsSynced;

                shopResults.push({
                    shopId: shop.shopId,
                    shopName: shop.shopName,
                    paymentsProcessed: result.paymentsProcessed,
                    paymentsSynced: result.paymentsSynced
                });

            } catch (error) {
                console.error(`Error processing shop ${shop.shopId}:`, error);
                shopResults.push({
                    shopId: shop.shopId,
                    shopName: shop.shopName,
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }

        return NextResponse.json({ 
            success: true,
            totalPaymentsSynced,
            shopResults
        });
    } catch (err: unknown) {
        console.error("Error syncing TikTok payments:", err);
        return NextResponse.json(
            { error: err instanceof Error ? err.message : "Internal Server Error" },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}