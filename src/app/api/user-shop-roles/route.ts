import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateToken, checkRole, checkShopPermission } from '@/lib/auth-middleware';

export async function GET(request: NextRequest) {
  try {
    // Validate token and get user
    const authResult = await validateToken(request);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { user } = authResult;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const shopId = searchParams.get('shopId') || '';

    const skip = (page - 1) * limit;

    // Build base where clause for permissions
    let baseWhere: any = {};

    // Add shop filter first
    if (shopId) {
      baseWhere.shopId = shopId;
    }

    // Check user permissions and add access restrictions
    if (!checkRole(user!.role, ['ADMIN', 'MANAGER'])) {
      // If not admin/manager, only show roles for shops they have access to
      baseWhere.shop = {
        userShopRoles: {
          some: {
            userId: user!.id,
            role: { in: ['OWNER', 'MANAGER'] }
          }
        }
      };
    }

    // For search, we need to get all records first then filter (since count doesn't support complex relations)
    let whereClause = baseWhere;
    let searchFilter: any = {};

    if (search) {
      // Check if search matches any of the enum role values
      const roleValues = ['OWNER', 'MANAGER', 'STAFF', 'VIEWER'];
      const matchingRoles = roleValues.filter(role => 
        role.toLowerCase().includes(search.toLowerCase())
      );

      searchFilter = {
        OR: [
          {
            user: {
              name: {
                contains: search,
                mode: 'insensitive' as const
              }
            }
          },
          {
            user: {
              email: {
                contains: search,
                mode: 'insensitive' as const
              }
            }
          },
          {
            shop: {
              shopName: {
                contains: search,
                mode: 'insensitive' as const
              }
            }
          },
          // For enum fields, use 'in' with matching values instead of 'contains'
          ...(matchingRoles.length > 0 ? [{
            role: {
              in: matchingRoles as any[]
            }
          }] : [])
        ].filter(Boolean) // Remove empty conditions
      };

      // Combine base where with search
      if (Object.keys(baseWhere).length > 0) {
        whereClause = {
          AND: [
            baseWhere,
            searchFilter
          ]
        };
      } else {
        whereClause = searchFilter;
      }
    }

    // Get total count and paginated results in parallel
    const [userRoles, total] = await Promise.all([
      // Get paginated user roles with search
      prisma.userShopRole.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          shop: {
            select: {
              id: true,
              shopName: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit,
      }),
      
      // Get total count - use a simpler approach for counting with search
      prisma.userShopRole.count({
        where: whereClause
      })
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({ 
      userRoles,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    });
  } catch (error) {
    console.error('Error fetching user roles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user roles' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Validate token and get user
    const authResult = await validateToken(request);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { user } = authResult;
    const { userId, shopId, role } = await request.json();

    if (!userId || !shopId || !role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if user has permission to assign roles in this shop
    const isAdmin = checkRole(user!.role, ['ADMIN']);
    const hasShopPermission = await checkShopPermission(user!.id, shopId, ['OWNER', 'MANAGER']);

    if (!isAdmin && !hasShopPermission) {
      return NextResponse.json(
        { error: 'Insufficient permissions to assign roles in this shop' },
        { status: 403 }
      );
    }

    // Check if user is already assigned to this shop
    const existingRole = await prisma.userShopRole.findUnique({
      where: {
        userId_shopId: {
          userId,
          shopId
        }
      }
    });

    if (existingRole) {
      return NextResponse.json(
        { error: 'User is already assigned to this shop' },
        { status: 400 }
      );
    }

    const userRole = await prisma.userShopRole.create({
      data: {
        userId,
        shopId,
        role
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        shop: {
          select: {
            id: true,
            shopName: true
          }
        }
      }
    });

    return NextResponse.json({ userRole }, { status: 201 });
  } catch (error) {
    console.error('Error creating user role:', error);
    return NextResponse.json(
      { error: 'Failed to create user role' },
      { status: 500 }
    );
  }
}