import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getUserWithShopAccess } from "@/lib/auth";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
    try {
        const { user, isAdmin } = await getUserWithShopAccess(req, prisma);
        const { shopId, managedName } = await req.json();

        // Validate input
        if (!shopId || !managedName) {
            return NextResponse.json(
                { error: "Shop ID and managed name are required" },
                { status: 400 }
            );
        }

        // Validate managed name length and format
        if (managedName.length < 2 || managedName.length > 50) {
            return NextResponse.json(
                { error: "Managed name must be between 2 and 50 characters" },
                { status: 400 }
            );
        }

        // Find the shop
        const shop = await prisma.shopAuthorization.findUnique({
            where: { shopId: shopId },
            include: { app: true }
        });

        if (!shop) {
            return NextResponse.json(
                { error: "Shop not found" },
                { status: 404 }
            );
        }

        // Update the managed name
        const updatedShop = await prisma.shopAuthorization.update({
            where: { shopId: shopId },
            data: { 
                managedName: managedName.trim(),
                updatedAt: new Date()
            },
            select: {
                id: true,
                shopId: true,
                shopName: true,
                managedName: true,
                status: true
            }
        });

        return NextResponse.json({
            success: true,
            message: "Shop managed name updated successfully",
            shop: updatedShop
        });

    } catch (error: any) {
        console.error("Error updating shop managed name:", error);
        
        if (error.message === 'Authentication required' || error.message === 'User not found') {
            return NextResponse.json({ error: error.message }, { status: 401 });
        }
        
        return NextResponse.json(
            { error: error.message || "Internal server error" },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}
