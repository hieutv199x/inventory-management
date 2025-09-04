import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserWithShopAccess, validateShopAccess, getActiveShopIds } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { user, accessibleShopIds, isAdmin } = await getUserWithShopAccess(request, prisma);

    const { searchParams } = new URL(request.url);
    const shopId = searchParams.get('shop_id');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const offset = (page - 1) * pageSize;

    const activeShopIds = await getActiveShopIds(prisma);

    // Build where clause based on user permissions
    let whereClause: any = {};

    // Handle 'all' parameter for shopId
    const requestedShopId = shopId === 'all' ? null : shopId;

    // Map accessibleShopIds (TikTok shopId) to Shop _id (ObjectID)
    let accessibleShopObjectIds: string[] = [];
    if (accessibleShopIds && accessibleShopIds.length > 0) {
      const shops = await prisma.shopAuthorization.findMany({
        where: { shopId: { in: accessibleShopIds } },
        select: { id: true, shopId: true },
      });
      accessibleShopObjectIds = shops.map(shop => shop.id);
    }

    // Map activeShopIds (TikTok shopId) to Shop _id (ObjectID)
    let activeShopObjectIds: string[] = [];
    if (activeShopIds && activeShopIds.length > 0) {
      const shops = await prisma.shopAuthorization.findMany({
        where: { shopId: { in: activeShopIds } },
        select: { id: true, shopId: true },
      });
      activeShopObjectIds = shops.map(shop => shop.id);
    }

    // Determine shop filter using ObjectIDs
    let shopObjectIdFilter: any = undefined;
    if (requestedShopId) {
      // Find the Shop _id by TikTok shopId
      const shop = await prisma.shopAuthorization.findUnique({
        where: { shopId: requestedShopId },
        select: { id: true },
      });
      if (!shop?.id) {
        return NextResponse.json({
          statements: [],
          pagination: {
            total: 0,
            page,
            pageSize,
            totalPages: 0,
            hasMore: false
          }
        });
      }
      shopObjectIdFilter = shop.id;
    } else if (isAdmin) {
      // Admin: all active shops
      shopObjectIdFilter = { in: activeShopObjectIds };
    } else {
      // Non-admin: only accessible and active shops
      const filteredIds = accessibleShopObjectIds.filter(id => activeShopObjectIds.includes(id));
      if (filteredIds.length === 0) {
        return NextResponse.json({
          statements: [],
          pagination: {
            total: 0,
            page,
            pageSize,
            totalPages: 0,
            hasMore: false
          }
        });
      }
      shopObjectIdFilter = { in: filteredIds };
    }

    if (shopObjectIdFilter !== undefined && shopObjectIdFilter !== null) {
      whereClause.shopId = shopObjectIdFilter;
    }

    // Add date range filter if provided
    if (startDate && endDate) {
      whereClause.statementTime = {
        gte: parseInt(startDate),
        lte: parseInt(endDate),
      };
    }

    // Get statements với shop active with pagination
    const [statements, total] = await Promise.all([
      prisma.statement.findMany({
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
        take: pageSize,
        skip: offset,
      }),
      prisma.statement.count({ where: whereClause })
    ]);

    // Lấy thêm thông tin bankAccount từ Payment dựa vào paymentId
    const statementsWithBankAccount = await Promise.all(
      statements.map(async (statement) => {
        let bankAccount = null;
        
        if (statement.paymentId) {
          try {
            const payment = await prisma.payment.findUnique({
              where: { paymentId: statement.paymentId },
              select: { bankAccount: true }
            });
            bankAccount = payment?.bankAccount || null;
          } catch (error) {
            console.warn(`Failed to fetch payment for paymentId ${statement.paymentId}:`, error);
          }
        }

        return {
          ...statement,
          bankAccount
        };
      })
    );

    const totalPages = Math.ceil(total / pageSize);

    return NextResponse.json({
      statements: statementsWithBankAccount,
      pagination: {
        total,
        page,
        pageSize,
        totalPages,
        hasMore: offset + pageSize < total
      }
    });
  } catch (error) {
    console.error('Error fetching statements:', error);
    if (error instanceof Error && (error.message === 'Authentication required' || error.message === 'User not found')) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json(
      { error: 'Failed to fetch statements' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}