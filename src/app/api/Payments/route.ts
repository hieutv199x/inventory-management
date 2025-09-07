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

    // Pagination parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '25');
    const offset = (page - 1) * limit;

    // Filter parameters
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

    // Get total count for pagination
    const totalItems = await prisma.payment.count({ where: whereClause });
    const totalPages = Math.ceil(totalItems / limit);

    // Get payments with pagination
    const payments = await prisma.payment.findMany({
      where: whereClause,
      include: {
        shop: {
          select: {
            shopName: true,
            shopId: true,
          },
        },
      },
      orderBy: {
        createTime: 'desc',
      },
      skip: offset,
      take: limit,
    });

    // Transform data for response
    const transformedPayments = payments.map((payment) => ({
      id: payment.id,
      paymentId: payment.paymentId,
      shopId: payment.shopId,
      amountValue: payment.amountValue || '0',
      amountCurrency: payment.amountCurrency || 'USD',
      settlementAmountValue: payment.settlementAmountValue,
      settlementAmountCurrency: payment.settlementAmountCurrency,
      createTime: payment.createTime,
      paidTime: payment.paidTime,
      status: payment.status,
      bankAccount: payment.bankAccount,
      shop: {
        shopName: payment.shop?.shopName || '',
        shopId: payment.shop?.shopId || '',
      },
    }));

    return NextResponse.json({
      success: true,
      data: transformedPayments,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        itemsPerPage: limit,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
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
