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
              id: true,
              shopId: true,
            },
          }
        },
      });

      const accessibleShopIds = userShopRoles.map((usr) => usr.shop?.shopId);

      // If user has no shop assignments, return empty result
      if (accessibleShopIds.length === 0) {
        return NextResponse.json([]);
      }

      // If specific shop is requested (not 'all'), check if user has access to it
      if (shopId && shopId !== 'all') {
        if (accessibleShopIds.includes(shopId)) {
          whereClause.shopId = shopId;
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
        whereClause.shopId = shopId;
      }
      // If shopId is 'all' or not provided, don't add shopId filter (get all shops)
    }

    // Add date range filter if provided
    if (startDate && endDate) {
      whereClause.statementTime = {
        gte: parseInt(startDate),
        lte: parseInt(endDate),
      };
    }

    // Lấy danh sách shopId active
    const activeShops = await prisma.shopAuthorization.findMany({
      where: { status: 'ACTIVE' }, // sửa lại nếu enum khác
      select: { shopId: true },
    });
    const activeShopIds = activeShops.map(shop => shop.shopId);

    // Lọc lại whereClause để chỉ lấy statement của shop active
    if (whereClause.shopId) {
      if (typeof whereClause.shopId === 'object' && whereClause.shopId.in) {
        whereClause.shopId.in = whereClause.shopId.in.filter((id: string) => activeShopIds.includes(id));
      } else if (!activeShopIds.includes(whereClause.shopId)) {
        // Nếu shopId không active thì trả về rỗng
        return NextResponse.json([]);
      }
    } else {
      whereClause.shopId = { in: activeShopIds };
    }

    // Get statements với shop active
    const statements = await prisma.tikTokStatement.findMany({
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
        statementTime: 'desc',
      },
    });

    return NextResponse.json(statements);
  } catch (error) {
    console.error('Error fetching statements:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statements' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
