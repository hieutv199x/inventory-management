import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * @method GET
 * @route /api/tiktok/shop/get-shops
 * @description Fetches all shops from the database.
 */

export async function GET() {
    try {
        const credentials = await prisma.shopAuthorization.findMany({
            orderBy: {
                createdAt: 'desc',
            },
            include: {
                app: true,
            },
        });

        return NextResponse.json({ credentials }, { status: 200 });
    } catch (error) {
        console.error('❌ Failed to fetch TikTok App Credentials:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}