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
    const shopId = searchParams.get('shop_id');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    // Build where clause based on user permissions
    let whereClause: any = {};

    // If user is not ADMIN or MANAGER, filter by user shop roles
    if (!['ADMIN', 'MANAGER'].includes(currentUser.role)) {
      // Get shops that the user has access to through UserShopRole
      const userShopRoles = await prisma.userShopRole.findMany({
        where: {
          userId: currentUser.id,
        },
        select: {
          shopId: true,
        },
      });

      const accessibleShopIds = userShopRoles.map((usr) => usr.shopId);

      // If user has no shop assignments, return empty result
      if (accessibleShopIds.length === 0) {
        return NextResponse.json([]);
      }

      // Filter by accessible shops (using ObjectId)
      whereClause.shopId = {
        in: accessibleShopIds,
      };
    }

    // If specific shop is requested (not 'all'), need to convert shopId string to ObjectId
    if (shopId && shopId !== 'all') {
      // Find the ShopAuthorization by shopId string to get the ObjectId
      const shop = await prisma.shopAuthorization.findUnique({
        where: { shopId: shopId },
        select: { id: true },
      });

      if (shop) {
        whereClause.shopId = shop.id; // Use ObjectId
      } else {
        // Shop not found, return empty result
        return NextResponse.json([]);
      }
    }

    // Add channel filter for TikTok payments
    whereClause.channel = 'TIKTOK';

    // If shopId is 'all' or not provided, we keep the existing whereClause
    // which already filters by user permissions for non-admin users

    // Add date range filter if provided
    if (startDate && endDate) {
      whereClause.createTime = {
        gte: parseInt(startDate),
        lte: parseInt(endDate),
      };
    }

    // Get payments with user access control
    const payments = await prisma.payment.findMany({
      where: whereClause,
      include: {
        shop: {
          select: {
            shopId: true,
            shopName: true,
          },
        },
      },
      orderBy: {
        createTime: 'desc',
      },
    });

    return NextResponse.json(payments);
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payments' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
