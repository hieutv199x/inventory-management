import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserWithShopAccess } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const { user, accessibleShopIds, isAdmin } = await getUserWithShopAccess(req, prisma);
    const { searchParams } = new URL(req.url);

    // Pagination parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '25');
    const offset = (page - 1) * limit;

    // Filter parameters
    const shopId = searchParams.get('shop_id');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    // Build where clause
    const where: any = {};

    // Shop access control
    if (!isAdmin) {
      where.shopId = { in: accessibleShopIds };
    } else if (shopId && shopId !== 'all') {
      const shop = await prisma.shopAuthorization.findUnique({
        where: { shopId: shopId }
      });
      if (shop) {
        where.shopId = shop.id;
      }
    }

    // Date range filter
    if (startDate || endDate) {
      where.createTime = {};
      if (startDate) {
        where.createTime.gte = parseInt(startDate);
      }
      if (endDate) {
        where.createTime.lte = parseInt(endDate);
      }
    }

    // Get total count for pagination
    const totalItems = await prisma.withdrawal.count({ where });
    const totalPages = Math.ceil(totalItems / limit);

    // Get withdrawals with pagination
    const withdrawals = await prisma.withdrawal.findMany({
      where,
      include: {
        shop: {
          select: {
            shopName: true,
            shopId: true
          }
        }
      },
      orderBy: {
        createTime: 'desc'
      },
      skip: offset,
      take: limit
    });

    return NextResponse.json({
      success: true,
      data: withdrawals,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        itemsPerPage: limit,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });

  } catch (err: any) {
    console.error('Error fetching withdrawals:', err);
    return NextResponse.json({ 
      success: false,
      error: err.message || 'Internal error' 
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}