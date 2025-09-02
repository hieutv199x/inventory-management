import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserWithShopAccess, getActiveShopIds, validateShopAccess } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { user, isAdmin, accessibleShopIds } = await getUserWithShopAccess(request, prisma);

    const { searchParams } = new URL(request.url);
    const channel = searchParams.get('channel');
    const requestedShopId = searchParams.get('shopId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

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

    // Build where clause
    let where: any = {};

    // Apply shop filter based on user permissions - use TikTok shopIds directly
    if (shopFilter) {
        if (typeof shopFilter === 'object' && shopFilter.in) {
            // shopFilter contains array of TikTok shopIds
            where.shopId = { in: shopFilter.in };
        } else if (typeof shopFilter === 'string') {
            // shopFilter is a single TikTok shopId
            where.shopId = shopFilter;
        }
    }

    // If filtering by shopId (TikTok shopId), use directly
    const shopId = searchParams.get('shopId');
    if (shopId) {
        where.shopId = shopId;
    }

    if (channel) {
      where.channel = channel as any;
    }
    
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          brand: true,
          skus: {
            include: {
              price: true,
              inventory: true
            }
          },
          images: true
        },
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.product.count({ where })
    ]);

    // Get shop information for the products
    const uniqueShopIds = [...new Set(products.map(p => p.shopId))];
    const shopAuthorizations = await prisma.shopAuthorization.findMany({
      where: { shopId: { in: uniqueShopIds } },
      select: { shopId: true, shopName: true }
    });

    const shopMap = Object.fromEntries(
      shopAuthorizations.map(s => [s.shopId, { shopName: s.shopName }])
    );

    return NextResponse.json({ 
      products: products.map(product => ({
        ...product,
        shop: shopMap[product.shopId] || { shopName: 'Unknown' },
        channelData: product.channelData ? JSON.parse(product.channelData) : null
      })),
      total,
      hasMore: offset + limit < total
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, isAdmin, accessibleShopIds } = await getUserWithShopAccess(request, prisma);

    const body = await request.json();
    const { 
      productId, 
      channel, 
      shopId, 
      title, 
      description, 
      status, 
      price, 
      currency, 
      channelData 
    } = body;

    // Validate required fields
    if (!productId || !channel || !shopId || !title || !status) {
      return NextResponse.json(
        { error: 'Missing required fields' }, 
        { status: 400 }
      );
    }

    // Check if user has access to this shop
    if (!isAdmin && !accessibleShopIds.includes(shopId)) {
      return NextResponse.json({ error: 'Access denied to this shop' }, { status: 403 });
    }

    const product = await prisma.product.create({
      data: {
        productId,
        channel,
        shopId,
        title,
        description: description || '',
        status,
        price,
        currency,
        channelData: channelData ? JSON.stringify(channelData) : null
      },
      include: {
        shop: {
          include: {
            app: true
          }
        }
      }
    });

    return NextResponse.json({ 
      product: {
        ...product,
        channelData: product.channelData ? JSON.parse(product.channelData) : null
      }
    });
  } catch (error) {
    console.error('Error creating product:', error);
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}