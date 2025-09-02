import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserWithShopAccess, getActiveShopIds, validateShopAccess } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { user, isAdmin, accessibleShopIds } = await getUserWithShopAccess(request, prisma);

    const { searchParams } = new URL(request.url);
    const channel = searchParams.get('channel');
    const appId = searchParams.get('appId');
    const requestedShopId = searchParams.get('shopId');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const offset = (page - 1) * pageSize;

    const where: any = {};
    
    // Apply shop filter based on user permissions
    if (isAdmin) {
      // Admin can see all shops, optionally filtered by requestedShopId
      if (requestedShopId) {
        where.shopId = requestedShopId;
      }
    } else {
      // Non-admin users can only see assigned shops
      if (accessibleShopIds.length === 0) {
        return NextResponse.json({ shops: [], pagination: { total: 0, page, pageSize, totalPages: 0 } });
      }
      
      if (requestedShopId && accessibleShopIds.includes(requestedShopId)) {
        where.shopId = requestedShopId;
      } else if (requestedShopId) {
        // User requested a specific shop they don't have access to
        return NextResponse.json({ shops: [], pagination: { total: 0, page, pageSize, totalPages: 0 } });
      } else {
        // Filter by accessible shops
        where.shopId = { in: accessibleShopIds };
      }
    }

    if (channel) {
      where.channelApp = { channel: channel as any };
    }
    if (appId) {
      where.appId = appId;
    }
    
    const [shops, total] = await Promise.all([
      prisma.shopAuthorization.findMany({
        where,
        include: {
          app: {
            select: {
              id: true,
              appName: true,
              channel: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: pageSize,
        skip: offset
      }),
      prisma.shopAuthorization.count({ where })
    ]);

    const totalPages = Math.ceil(total / pageSize);

    return NextResponse.json({ 
      shops,
      pagination: {
        total,
        page,
        pageSize,
        totalPages
      }
    });
  } catch (error) {
    console.error('Error fetching shops:', error);
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, isAdmin } = await getUserWithShopAccess(request, prisma);

    // Only admins can create shop authorizations
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { 
      shopId, 
      shopName, 
      appId, 
      accessToken, 
      refreshToken, 
      expiresIn, 
      scope, 
      channelData, 
      credentials 
    } = body;

    // Validate required fields
    if (!shopId || !appId || !accessToken) {
      return NextResponse.json(
        { error: 'Missing required fields: shopId, appId, accessToken' }, 
        { status: 400 }
      );
    }

    const shop = await prisma.shopAuthorization.create({
      data: {
        shopId,
        shopName,
        appId,
        accessToken,
        refreshToken,
        expiresIn,
        scope,
        channelData: JSON.stringify(channelData || {}),
        credentials: credentials ? JSON.stringify(credentials) : null
      },
      include: {
        app: true
      }
    });

    return NextResponse.json({ shop });
  } catch (error) {
    console.error('Error creating shop authorization:', error);
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
