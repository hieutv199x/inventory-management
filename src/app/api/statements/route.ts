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

    const activeShopIds = await getActiveShopIds(prisma);

    // Build where clause based on user permissions
    let whereClause: any = {};

    // Handle 'all' parameter for shopId
    const requestedShopId = shopId === 'all' ? null : shopId;
    
    const { shopFilter, hasAccess } = validateShopAccess(requestedShopId, isAdmin, accessibleShopIds, activeShopIds);
    
    if (!hasAccess) {
      return NextResponse.json([]);
    }

    whereClause.shopId = shopFilter;

    // Add date range filter if provided
    if (startDate && endDate) {
      whereClause.statementTime = {
        gte: parseInt(startDate),
        lte: parseInt(endDate),
      };
    }

    // Get statements với shop active
    const statements = await prisma.statement.findMany({
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