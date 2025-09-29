import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getUserWithShopAccess, getActiveShopIds } from "@/lib/auth";
import { resolveOrgContext, requireOrg, withOrgScope } from '@/lib/tenant-context';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
    try {
    const { user, accessibleShopIds, isAdmin } = await getUserWithShopAccess(req, prisma);
    const orgResult = await resolveOrgContext(req, prisma);
    const org = requireOrg(orgResult);
        const activeShopIds = await getActiveShopIds(prisma);

        // Extract query parameters
        const { searchParams } = new URL(req.url);
        const shopId = searchParams.get('shopId');
        const status = searchParams.get('status');
        const listingQuality = searchParams.get('listingQuality');
        const keyword = searchParams.get('keyword');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        
        // Pagination parameters
        const page = parseInt(searchParams.get('page') || '1', 10);
        const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);
        const offset = (page - 1) * pageSize;

        // Build where condition
        let whereCondition: any = {};

        // First get the shop ObjectIDs that correspond to accessible TikTok shop IDs
        let allowedShopObjectIds: string[] = [];
        
        if (!isAdmin && !shopId) {
            // For non-admin users, get ObjectIDs of accessible shops
            const accessibleShops = await prisma.shopAuthorization.findMany({
                where: {
                    shopId: { in: accessibleShopIds.filter(id => activeShopIds.includes(id)) }
                },
                select: { id: true }
            });
            allowedShopObjectIds = accessibleShops.map(shop => shop.id);
        } else {
            // For admin users, get all active shops unless specific shop is requested
            if (!shopId) {
                const activeShops = await prisma.shopAuthorization.findMany({
                    where: { id: { in: activeShopIds } },
                    select: { id: true }
                });
                allowedShopObjectIds = activeShops.map(shop => shop.id);
            }
        }

        // Apply shop filter
        if (shopId) {
            // Find the ObjectID for the specific shopId
            const targetShop = await prisma.shopAuthorization.findUnique({
                where: { id: shopId },
                select: { id: true }
            });
            
            if (!targetShop) {
                return NextResponse.json({
                    products: [],
                    pagination: {
                        currentPage: page,
                        pageSize,
                        totalItems: 0,
                        totalPages: 0,
                        hasNextPage: false,
                        hasPreviousPage: false
                    }
                });
            }
            
            whereCondition.shopId = targetShop.id;
        } else if (allowedShopObjectIds.length > 0) {
            whereCondition.shopId = { in: allowedShopObjectIds };
        } else {
            // No accessible shops, return empty result
            return NextResponse.json({
                products: [],
                pagination: {
                    currentPage: page,
                    pageSize,
                    totalItems: 0,
                    totalPages: 0,
                    hasNextPage: false,
                    hasPreviousPage: false
                }
            });
        }

        // Apply other filters
        if (status && status !== 'All') {
            whereCondition.status = status;
        }

        if (listingQuality) {
            whereCondition.listingQuality = listingQuality;
        }

        if (keyword) {
            whereCondition.OR = [
                { productId: { contains: keyword, mode: 'insensitive' } },
                { title: { contains: keyword, mode: 'insensitive' } },
                { description: { contains: keyword, mode: 'insensitive' } }
            ];
        }

        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999); // End of day
            
            whereCondition.createTime = {
                gte: Math.floor(start.getTime() / 1000),
                lte: Math.floor(end.getTime() / 1000)
            };
        }

        // Get total count for pagination
    // Always enforce org scope
    const scopedWhere = withOrgScope(org.id, whereCondition);
    const totalItems = await prisma.product.count({
      where: scopedWhere
    });

        // Get paginated products
    const products = await prisma.product.findMany({
      where: scopedWhere,
            include: {
                shop: {
                    select: {
                        shopName: true,
                        shopId: true,
                        managedName: true
                    }
                },
                images: true,
                skus: {
                    include: {
                        price: true
                    }
                }
            },
            orderBy: {
                createTime: 'desc'
            },
            skip: offset,
            take: pageSize
        });

        const totalPages = Math.ceil(totalItems / pageSize);

        return NextResponse.json({
            products,
            pagination: {
                currentPage: page,
                pageSize,
                totalItems,
                totalPages,
                hasNextPage: page < totalPages,
                hasPreviousPage: page > 1
            }
        });

    } catch (err: any) {
        console.error("Error fetching products:", err);
        if (err.message === 'Authentication required' || err.message === 'User not found') {
            return NextResponse.json({ error: err.message }, { status: 401 });
        }
        return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, isAdmin, accessibleShopIds } = await getUserWithShopAccess(request, prisma);
    const orgResult = await resolveOrgContext(request, prisma);
    const org = requireOrg(orgResult);

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

      // Enforce shop belongs to active org
      if (shopAuth.orgId && shopAuth.orgId !== org.id) {
        return NextResponse.json({ error: 'Shop does not belong to active organization' }, { status: 403 });
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
          channelData: channelData ? JSON.stringify(channelData) : null,
          orgId: org.id
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