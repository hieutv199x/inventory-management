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

    // Create or find the TikTok ChannelApp
    const app = await prisma.channelApp.upsert({
      where: { appKey },
      create: {
        appName,
        channel: 'TIKTOK', // Add channel field
        appId: serviceId, // Using serviceId as appId
        appKey,
        appSecret,
        BaseUrl: 'https://open-api.tiktokglobalshop.com', 
        isActive: true,
        config: JSON.stringify({ 
          country,
          createdBy: currentUser.id,
          createdAt: new Date().toISOString()
        }),
      },
      update: {
        appName,
        appSecret,
        isActive: true,
        config: JSON.stringify({ 
          country,
          updatedBy: currentUser.id,
          updatedAt: new Date().toISOString()
        }),
      },
    });

    return NextResponse.json(
      { message: 'TikTok app is saved successfully', data: app },
      { status: 201 }
    );
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