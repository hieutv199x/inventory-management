import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get('Authorization');
        const token = authHeader?.replace('Bearer ', '');

        if (!token) {
            return NextResponse.json(
                { message: 'Authentication required' },
                { status: 401 }
            );
        }
        //jwt.verify(token, JWT_SECRET);
        const { searchParams } = new URL(request.url);
        const shopId = searchParams.get('shop_id');

        const whereClause = shopId && shopId !== 'all' ? { shopId } : {};

        const payments = await prisma.tikTokPayment.findMany({
            where: whereClause,
            orderBy: {
                createTime: 'desc',
            },
            include: {
                shop: true,
            },
        });

        return NextResponse.json(payments);

    } catch (error) {
        console.error('Get shops error:', error);
        return NextResponse.json(
            { message: 'Authentication required' },
            { status: 401 }
        );
    }
}
