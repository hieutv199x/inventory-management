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

/**
 * @method GET
 * @route /api/tiktok/shop/get-shops
 * @description Fetches all shops from the database.
 */

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '12', 10);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';

    const skip = (page - 1) * limit;

    // Build where clause for search
    const whereClause: any = {};

    // Filter by status if provided (e.g., 'ACTIVE')
    if (status) {
      whereClause.status = status;
    }

    // Add search functionality
    if (search) {
      whereClause.OR = [
        { shopName: { contains: search, mode: 'insensitive' } },
        { shopId: { contains: search, mode: 'insensitive' } },
        { country: { contains: search, mode: 'insensitive' } },
        { app: { appName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    // Role-based filtering - Use UserShopRole for permission checking
    if (!['ADMIN', 'MANAGER'].includes(currentUser.role)) {
      // Get shops that the user has access to through UserShopRole
      whereClause.userShopRoles = {
        some: {
          userId: currentUser.id,
        },
      };
    }

    // Get shops with search and pagination
    const [credentials, totalCount] = await Promise.all([
      prisma.shopAuthorization.findMany({
        where: whereClause,
        include: {
          app: {
            select: {
              id: true,
              appId: true,
              appKey: true,
              appSecret: true,
              appName: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.shopAuthorization.count({
        where: whereClause,
      }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    // Transform the data to match frontend expectations
    const transformedCredentials = credentials.map((shop) => ({
      id: shop.id,
      shopId: shop.shopId,
      shopName: shop.shopName,
      shopCipher: shop.shopCipher,
      country: shop.region,
      status: shop.status,
      app: {
        appId: shop.app.appId,
        appKey: shop.app.appKey,
        appSecret: shop.app.appSecret,
        appName: shop.app.appName,
      },
      createdAt: shop.createdAt,
    }));

    return NextResponse.json({
      credentials: transformedCredentials,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages,
      },
    });
  } catch (error) {
    console.error('Error fetching shops:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shops' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}