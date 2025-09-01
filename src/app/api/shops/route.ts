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

    // Get active shop IDs
    const activeShopIds = await getActiveShopIds(prisma);

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

    const where: any = {};
    
    // Apply shop filter based on user permissions
    if (shopFilter) {
      where.shopId = shopFilter;
    }

    if (channel) {
      where.app = { channel: channel as any };
    }
    if (appId) {
      where.appId = appId;
    }
    
    const shops = await prisma.shopAuthorization.findMany({
      where,
      include: {
        app: {
          select: {
            id: true,
            appName: true,
            channel: true
          }
        },
        _count: {
          select: {
            orders: true,
            products: true,
            payments: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ shops });
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
