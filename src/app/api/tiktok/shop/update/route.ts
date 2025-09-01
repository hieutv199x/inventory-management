import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserWithShopAccess } from '@/lib/auth';

const prisma = new PrismaClient();

/**
 * @method PUT
 * @route /api/tiktok/shop/update
 * @description Updates an existing TikTok shop authorization
 */
export async function PUT(request: NextRequest) {
  try {
    const { user, isAdmin, accessibleShopIds } = await getUserWithShopAccess(request, prisma);

    const body = await request.json();
    const { 
      id,
      shopId, 
      shopName, 
      shopCipher,
      region,
      accessToken, 
      refreshToken, 
      expiresIn, 
      scope,
      status
    } = body;

    // Validate required fields
    if (!id) {
      return NextResponse.json(
        { error: 'Missing shop ID' }, 
        { status: 400 }
      );
    }

    // Get existing shop
    const existingShop = await prisma.shopAuthorization.findUnique({
      where: { id },
      include: { app: true }
    });

    if (!existingShop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    // Check if user has access to this shop
    if (!isAdmin && !accessibleShopIds.includes(existingShop.shopId)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Ensure this is a TikTok shop
    if (!existingShop.app || existingShop.app.channel !== 'TIKTOK') {
      return NextResponse.json({ error: 'Not a TikTok shop' }, { status: 400 });
    }

    // Parse existing channelData and merge with new data
    let existingChannelData = {};
    try {
      existingChannelData = existingShop.channelData ? JSON.parse(existingShop.channelData) : {};
    } catch (error) {
      console.warn('Failed to parse existing channelData');
    }

    const updatedChannelData = {
      ...existingChannelData,
      ...(shopCipher !== undefined && { shopCipher }),
      ...(region !== undefined && { region }),
    };

    // Prepare update data
    const updateData: any = {
      ...(shopName !== undefined && { shopName }),
      ...(accessToken !== undefined && { accessToken }),
      ...(refreshToken !== undefined && { refreshToken }),
      ...(expiresIn !== undefined && { expiresIn }),
      ...(scope !== undefined && { scope }),
      ...(status !== undefined && { status }),
      channelData: JSON.stringify(updatedChannelData)
    };

    const updatedShop = await prisma.shopAuthorization.update({
      where: { id },
      data: updateData,
      include: {
        app: true
      }
    });

    return NextResponse.json({ 
      shop: {
        ...updatedShop,
        channelData: updatedShop.channelData ? JSON.parse(updatedShop.channelData) : null
      }
    });
  } catch (error) {
    console.error('Error updating TikTok shop:', error);
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
