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

    jwt.verify(token, JWT_SECRET);
    
    // Get shops from ShopAuthorization
    const shopAuthorizations = await prisma.shopAuthorization.findMany({
      where: {
        status: 'ACTIVE'
      },
      select: {
        id: true,
        shopName: true,
        shopId: true
      }
    });

    const shops = shopAuthorizations.map(shop => ({
      id: shop.id,
      name: shop.shopName || `Shop ${shop.shopId}`
    }));

    return NextResponse.json(shops);

  } catch (error) {
    console.error('Get shops error:', error);
    return NextResponse.json(
      { message: 'Authentication required' },
      { status: 401 }
    );
  }
}
