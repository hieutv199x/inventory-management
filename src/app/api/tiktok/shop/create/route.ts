import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserWithShopAccess } from '@/lib/auth';
import { requireOrg, resolveOrgContext } from '@/lib/tenant-context';

const prisma = new PrismaClient();

/**
 * @method POST
 * @route /api/tiktok/shop/create
 * @description Creates a new TikTok shop authorization
 */
export async function POST(request: NextRequest) {
  try {
    const { user, isAdmin } = await getUserWithShopAccess(request, prisma);

    const orgResult = await resolveOrgContext(request, prisma);
    const org = requireOrg(orgResult);

    // Only admins can create shop authorizations
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const {
      shopId,
      shopName,
      shopCipher,
      region,
      appId,
      accessToken,
      refreshToken,
      expiresIn,
      scope
    } = body;

    // Validate required fields
    if (!shopId || !appId || !accessToken) {
      return NextResponse.json(
        { error: 'Missing required fields: shopId, appId, accessToken' },
        { status: 400 }
      );
    }

    // Check if app exists and is a TikTok app
    const app = await prisma.channelApp.findUnique({
      where: { id: appId }
    });

    if (!app || app.channel !== 'TIKTOK') {
      return NextResponse.json(
        { error: 'Invalid TikTok app' },
        { status: 400 }
      );
    }

    // Prepare channelData for TikTok
    const channelData = {
      shopCipher: shopCipher || null,
      region: region || null,
    };

    const shop = await prisma.shopAuthorization.create({
      data: {
        shopId,
        shopName,
        appId,
        accessToken,
        refreshToken,
        expiresIn,
        scope,
        channelData: JSON.stringify(channelData),
        status: 'ACTIVE',
        orgId: org.id,
      },
      include: {
        app: true
      }
    });

    return NextResponse.json({
      shop: {
        ...shop,
        channelData: shop.channelData ? JSON.parse(shop.channelData) : null
      }
    });
  } catch (error) {
    console.error('Error creating TikTok shop:', error);
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
