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
    const status = searchParams.get('status'); // Thêm status parameter
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get active shop IDs with error handling
    let activeShopIds: string[] = [];
    try {
      activeShopIds = await getActiveShopIds(prisma);
    } catch (error) {
      console.warn('Failed to get active shop IDs, using fallback:', error);
      activeShopIds = accessibleShopIds;
    }

    // Handle special case for 'all' shops before validation
    let shopFilter: any = null;
    let hasAccess = true;

    if (requestedShopId === 'all') {
      // For 'all' case, always allow access and set appropriate filter
      hasAccess = true;
      if (!isAdmin && accessibleShopIds.length > 0) {
        shopFilter = { in: accessibleShopIds };
      }
      // If admin, shopFilter remains null (no filtering)
    } else {
      // For specific shop or null, use normal validation
      const validation = validateShopAccess(
        requestedShopId,
        isAdmin,
        accessibleShopIds,
        activeShopIds
      );
      shopFilter = validation.shopFilter;
      hasAccess = validation.hasAccess;
    }

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Build where clause with proper shop filtering
    let where: any = {};

    if (channel) {
      where.channel = channel as any;
    }

    if (status && status !== 'All') {
      where.status = status;
    }

    // Handle shop filtering with ObjectID references
    if (requestedShopId && requestedShopId !== 'all') {
      try {
        // Find the shop authorization by shopId (TikTok shop ID)
        const shopAuth = await prisma.shopAuthorization.findUnique({
          where: { shopId: requestedShopId }
        });
        
        if (shopAuth) {
          where.shopId = shopAuth.id; // Use the ObjectID reference
        } else {
          // If shop not found, return empty results
          return NextResponse.json({ 
            products: [],
            total: 0,
            hasMore: false
          });
        }
      } catch (error) {
        console.warn('Error finding shop authorization:', error);
      }
    } else if (requestedShopId === 'all' && shopFilter && shopFilter.in) {
      // Handle 'all' case with access restrictions for non-admin users
      try {
        const shopAuths = await prisma.shopAuthorization.findMany({
          where: { shopId: { in: shopFilter.in } },
          select: { id: true }
        });
        
        if (shopAuths.length > 0) {
          where.shopId = { in: shopAuths.map(s => s.id) };
        } else {
          return NextResponse.json({ 
            products: [],
            total: 0,
            hasMore: false
          });
        }
      } catch (error) {
        console.warn('Error finding shop authorizations for all shops:', error);
      }
    } else if (shopFilter && typeof shopFilter === 'object' && shopFilter.in) {
      // Handle multiple shop IDs
      try {
        const shopAuths = await prisma.shopAuthorization.findMany({
          where: { shopId: { in: shopFilter.in } },
          select: { id: true }
        });
        
        if (shopAuths.length > 0) {
          where.shopId = { in: shopAuths.map(s => s.id) };
        } else {
          return NextResponse.json({ 
            products: [],
            total: 0,
            hasMore: false
          });
        }
      } catch (error) {
        console.warn('Error finding shop authorizations:', error);
      }
    }
    // If requestedShopId === 'all' and user is admin, no shop filtering (where.shopId remains undefined)
    
    // Fetch products with proper relations
    let products, total;
    try {
      [products, total] = await Promise.all([
        prisma.product.findMany({
          where,
          include: {
            shop: {
              select: {
                id: true,
                shopId: true,
                shopName: true
              }
            },
            brand: true,
            skus: {
              include: {
                price: true,
                inventory: true
              }
            },
            images: true,
            categories: true
          },
          take: limit,
          skip: offset,
          orderBy: { createdAt: 'desc' }
        }),
        prisma.product.count({ where })
      ]);
    } catch (dbError) {
      console.error('Database query failed:', dbError);
      
      if (dbError instanceof Error && 
          (dbError.message.includes('forcibly closed') || 
           dbError.message.includes('I/O error') ||
           dbError.message.includes('timed out'))) {
        return NextResponse.json({ 
          error: 'Database connection issue - please try again',
          code: 'CONNECTION_ERROR'
        }, { status: 503 });
      }
      
      throw dbError;
    }

    return NextResponse.json({ 
      products: products.map(product => ({
        ...product,
        shop: product.shop ? {
          shopId: product.shop.shopId,
          shopName: product.shop.shopName || 'Unknown'
        } : { shopName: 'No Shop', shopId: null },
        channelData: product.channelData ? JSON.parse(product.channelData) : null
      })),
      total,
      hasMore: offset + limit < total
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('Malformed ObjectID')) {
        return NextResponse.json({ 
          error: 'Database schema configuration issue',
          details: 'ObjectID format incompatibility'
        }, { status: 500 });
      }
      
      if (error.message.includes('forcibly closed') || 
          error.message.includes('I/O error') ||
          error.message.includes('timed out')) {
        return NextResponse.json({ 
          error: 'Database connection lost - please try again',
          code: 'CONNECTION_ERROR'
        }, { status: 503 });
      }
      
      if (error.message === 'Authentication required') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
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

    // Convert shopId (TikTok shop ID) to ObjectID reference
    let shopObjectId: string;
    try {
      const shopAuth = await prisma.shopAuthorization.findUnique({
        where: { shopId: String(shopId) }
      });
      
      if (!shopAuth) {
        return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
      }
      
      shopObjectId = shopAuth.id;
    } catch (error) {
      console.error('Error finding shop:', error);
      return NextResponse.json({ error: 'Error validating shop' }, { status: 500 });
    }

    // Check if user has access to this shop
    if (!isAdmin && !accessibleShopIds.includes(String(shopId))) {
      return NextResponse.json({ error: 'Access denied to this shop' }, { status: 403 });
    }

    let product;
    try {
      product = await prisma.product.create({
        data: {
          productId,
          channel,
          shopId: shopObjectId, // Use ObjectID reference
          title,
          description: description || '',
          status,
          price,
          currency,
          channelData: channelData ? JSON.stringify(channelData) : null
        },
        include: {
          shop: {
            select: {
              id: true,
              shopId: true,
              shopName: true
            }
          },
          brand: true,
          skus: {
            include: {
              price: true,
              inventory: true
            }
          },
          images: true
        }
      });
    } catch (dbError) {
      console.error('Database create failed:', dbError);
      
      if (dbError instanceof Error && 
          (dbError.message.includes('forcibly closed') || 
           dbError.message.includes('I/O error'))) {
        return NextResponse.json({ 
          error: 'Database connection issue - please try again',
          code: 'CONNECTION_ERROR'
        }, { status: 503 });
      }
      
      throw dbError;
    }

    return NextResponse.json({ 
      product: {
        ...product,
        shop: product.shop ? {
          shopId: product.shop.shopId,
          shopName: product.shop.shopName || 'Unknown'
        } : { shopName: 'No Shop', shopId: null },
        channelData: product.channelData ? JSON.parse(product.channelData) : null
      }
    });
  } catch (error) {
    console.error('Error creating product:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('forcibly closed') || 
          error.message.includes('I/O error')) {
        return NextResponse.json({ 
          error: 'Database connection lost - please try again',
          code: 'CONNECTION_ERROR'
        }, { status: 503 });
      }
      
      if (error.message === 'Authentication required') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }
    
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}