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
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const search = searchParams.get('search') || '';
    const shopId = searchParams.get('shopId') || '';

    const skip = (page - 1) * limit;

    // Build where clause
    let whereClause: any = {};

    // If user is not ADMIN, filter by shops they have access to
    if (!checkRole(user!.role, ['ADMIN'])) {
      const userShopRoles = await prisma.userShopRole.findMany({
        where: {
          userId: user!.id,
          role: { in: ['OWNER'] } // Only owners and resource managers can view all roles
        },
        select: { shopId: true }
      });

      const accessibleShopIds = userShopRoles.map(role => role.shopId);
      
      if (accessibleShopIds.length === 0) {
        return NextResponse.json({
          userRoles: [],
          pagination: { page, limit, total: 0, totalPages: 0 }
        });
      }

      whereClause.shopId = { in: accessibleShopIds };
    }

    // Apply search filter
    if (search) {
      whereClause.OR = [
        {
          user: {
            name: { contains: search, mode: 'insensitive' }
          }
        },
        {
          user: {
            email: { contains: search, mode: 'insensitive' }
          }
        },
        {
          shop: {
            shopName: { contains: search, mode: 'insensitive' }
          }
        }
      ];
    }

    // Apply shop filter
    if (shopId) {
      whereClause.shopId = shopId;
    }

    const [userRoles, total] = await Promise.all([
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
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.userShopRole.count({ where: whereClause })
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      userRoles,
      pagination: { page, limit, total, totalPages }
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
        { error: 'userId, shopId, and role are required' },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = ['OWNER', 'RESOURCE', 'ACCOUNTANT', 'SELLER'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be one of: OWNER, RESOURCE, ACCOUNTANT, SELLER' },
        { status: 400 }
      );
    }

    // Check if user has permission to assign roles to this shop
    const isAdmin = checkRole(user!.role, ['ADMIN']);
    const hasShopPermission = await checkShopPermission(user!.id, shopId, ['OWNER', 'RESOURCE']);

    if (!isAdmin && !hasShopPermission) {
      return NextResponse.json(
        { error: 'Insufficient permissions to assign roles in this shop' },
        { status: 403 }
      );
    }

    // Check if the user already has a role in this shop
    const existingRole = await prisma.userShopRole.findFirst({
      where: {
        userId,
        shopId
      }
    });

    if (existingRole) {
      return NextResponse.json(
        { error: 'User already has a role in this shop' },
        { status: 400 }
      );
    }

    // Verify that both user and shop exist
    const [targetUser, targetShop] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.shopAuthorization.findUnique({ where: { id: shopId } })
    ]);

    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (!targetShop) {
      return NextResponse.json(
        { error: 'Shop not found' },
        { status: 404 }
      );
    }

    const newUserRole = await prisma.userShopRole.create({
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

    return NextResponse.json({ userRole: newUserRole });
  } catch (error) {
    console.error('Error creating user role:', error);
    return NextResponse.json(
      { error: 'Failed to create user role' },
      { status: 500 }
    );
  }
}