import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserWithShopAccess, getActiveShopIds, validateShopAccess } from '@/lib/auth';

const prisma = new PrismaClient();

/**
 * @method GET
 * @route /api/tiktok/shop/get-shops
 * @description Fetches all shops from the database with proper authentication.
 */
export async function GET(request: NextRequest) {
  try {
    const {
      isAdmin,
      accessibleShopIds,
      managedGroupIds = [],
      directShopIds = [],
      activeOrgId
    } = await getUserWithShopAccess(request, prisma);

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '12', 10);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const requestedShopId = searchParams.get('shopId');

    const skip = (page - 1) * limit;

    // Get active shop IDs
    const activeShopIds = await getActiveShopIds(prisma, {
      orgId: activeOrgId ?? undefined,
      groupIds: isAdmin ? undefined : managedGroupIds,
      shopIds: isAdmin ? undefined : directShopIds
    });

    // Validate shop access
    const { shopFilter, hasAccess } = validateShopAccess(
      requestedShopId,
      isAdmin,
      accessibleShopIds,
      activeShopIds
    );

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Build where clause
    const whereClause: any = {
      app: {
        channel: 'TIKTOK', // Filter for TikTok shops only
      },
    };

    // Apply shop filter based on user permissions
    if (shopFilter) {
      if (typeof shopFilter === 'string') {
        whereClause.shopId = shopFilter;
      } else {
        whereClause.shopId = shopFilter;
      }
    }

    // Filter by status if provided
    if (status) {
      whereClause.status = status;
    }

    // Add search functionality
    if (search) {
      whereClause.OR = [
        { shopName: { contains: search, mode: 'insensitive' } },
        { shopId: { contains: search, mode: 'insensitive' } },
        { app: { appName: { contains: search, mode: 'insensitive' } } },
      ];
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
              channel: true,
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
    const transformedCredentials = credentials.map((shop) => {
      // Parse channelData to extract TikTok-specific fields
      let channelData = {};
      try {
        channelData = shop.channelData ? JSON.parse(shop.channelData) : {};
      } catch (error) {
        console.warn('Failed to parse channelData for shop:', shop.shopId);
      }

      return {
        id: shop.id,
        shopId: shop.shopId,
        shopName: shop.shopName,
        shopCipher: (channelData as any)?.shopCipher || null,
        country: (channelData as any)?.region || null,
        status: shop.status,
        app: shop.app
          ? {
              appId: shop.app.appId,
              appKey: shop.app.appKey,
              appSecret: shop.app.appSecret,
              appName: shop.app.appName,
              channel: shop.app.channel,
            }
          : null,
        channelData: channelData,
        createdAt: shop.createdAt,
      };
    });

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
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json(
      { error: 'Failed to fetch shops' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}