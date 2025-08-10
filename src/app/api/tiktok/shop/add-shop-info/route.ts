import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const verifyToken = (request: NextRequest) => {
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (!token) {
    throw new Error('Authentication required');
  }

  return jwt.verify(token, JWT_SECRET) as any;
};

export async function POST(request: NextRequest) {
  try {
    const decoded = verifyToken(request);

    // Get current user
    const currentUser = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Only ADMIN and MANAGER can add shops
    if (!['ADMIN', 'MANAGER'].includes(currentUser.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { country, serviceId, appName, appKey, appSecret } = await request.json();

    // Validate required fields
    if (!country || !serviceId || !appName || !appKey || !appSecret) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Create or find the TikTok app
    const app = await prisma.tikTokApp.upsert({
      where: { appKey },
      create: {
        appName,
        appId: serviceId, // Using serviceId as appId
        appKey,
        appSecret,
        isActive: true,
      },
      update: {
        appName,
        appSecret,
        isActive: true,
      },
    });

    // Create shop authorization
    const shopAuth = await prisma.shopAuthorization.create({
      data: {
        shopId: serviceId,
        shopCipher: `cipher_${Date.now()}`, // Generate a cipher
        shopName: appName, // Using appName as shop name temporarily
        region: country,
        accessToken: 'temp_access_token', // This should be obtained from TikTok OAuth
        refreshToken: 'temp_refresh_token', // This should be obtained from TikTok OAuth
        expiresIn: 3600,
        scope: 'shop.basic',
        status: 'ACTIVE',
        appId: app.id,
      },
    });

    return NextResponse.json({
      message: 'Shop added successfully',
      shop: {
        id: shopAuth.id,
        shopId: shopAuth.shopId,
        shopName: shopAuth.shopName,
        country: shopAuth.region,
        status: shopAuth.status,
      },
    });
  } catch (error) {
    console.error('Error adding shop:', error);
    return NextResponse.json(
      { error: 'Failed to add shop' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}