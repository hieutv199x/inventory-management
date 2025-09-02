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
          shop: {
            select: {
              id: true, // MongoDB ObjectID
              shopId: true,
            },
          }
        },
      });

      // Use MongoDB _id for filtering
      const accessibleShopIds = userShopRoles
        .map((usr) => usr.shop?.id)
        .filter((id): id is string => !!id);

      // If user has no shop assignments, return empty result
      if (accessibleShopIds.length === 0) {
        return NextResponse.json([]);
      }

      // If specific shop is requested (not 'all'), check if user has access to it
      if (shopId && shopId !== 'all') {
        // Find the shop's _id by TikTok shopId
        const matchedShop = userShopRoles.find(usr => String(usr.shop?.shopId) === String(shopId));
        if (matchedShop && matchedShop.shop?.id) {
          whereClause.shopId = matchedShop.shop.id;
        } else {
          // User doesn't have access to the requested shop
          return NextResponse.json([]);
        }
      } else {
        // shopId is 'all' or not provided, filter by accessible shops
        whereClause.shopId = {
          in: accessibleShopIds,
        };
      }
    } else {
      // Admin/Manager can access all shops
      if (shopId && shopId !== 'all') {
        // Find the shop's _id by TikTok shopId
        const shop = await prisma.shopAuthorization.findUnique({
          where: { shopId: shopId },
          select: { id: true },
        });
        if (shop?.id) {
          whereClause.shopId = shop.id;
        } else {
          return NextResponse.json([]);
        }
      }
      // If shopId is 'all' or not provided, don't add shopId filter (get all shops)
    }

    // Add date range filter if provided
    if (startDate && endDate) {
      whereClause.createTime = {
        gte: parseInt(startDate),
        lte: parseInt(endDate),
      };
    }

    // Get active shops list to filter withdrawals
    const activeShopAuthorizations = await prisma.shopAuthorization.findMany({
      where: { status: 'ACTIVE' },
      select: { shopId: true },
    });
    const activeShopTikTokIds = activeShopAuthorizations
      .map(shop => shop.shopId)
      .filter((id): id is string => !!id);

    // Fetch Shop documents to get their MongoDB _id for active shops
    const activeShops = await prisma.shopAuthorization.findMany({
      where: { shopId: { in: activeShopTikTokIds } },
      select: { id: true, shopId: true },
    });
    const activeShopIds = activeShops.map(shop => shop.id);

    // Filter whereClause to only get withdrawals from active shops
    if (whereClause.shopId) {
      if (typeof whereClause.shopId === 'object' && whereClause.shopId.in) {
        whereClause.shopId.in = whereClause.shopId.in.filter((id: string) => activeShopIds.includes(id));
        if (whereClause.shopId.in.length === 0) {
          return NextResponse.json([]);
        }
      } else if (!activeShopIds.includes(whereClause.shopId)) {
        // If shopId is not active, return empty result
        return NextResponse.json([]);
      }
    } else {
      whereClause.shopId = { in: activeShopIds };
    }

    // Get withdrawals with active shop filtering
    const withdrawals = await prisma.withdrawal.findMany({
      where: whereClause,
      include: {
        shop: {
          select: {
            shopName: true,
            status: true,
          },
        },
      },
      orderBy: {
        createTime: 'desc',
      },
    });

    return NextResponse.json(withdrawals);
  } catch (error) {
    console.error('Error fetching withdrawals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch withdrawals' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
