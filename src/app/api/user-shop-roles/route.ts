import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserWithShopAccess } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const {
      isAdmin,
      accessibleShopIds,
      directShopIds = [],
      managedGroupIds = [],
      managedGroupShopIds = [],
      activeOrgId
    } = await getUserWithShopAccess(request, prisma);

    if (!activeOrgId) {
      return NextResponse.json({ error: 'ACTIVE_ORG_REQUIRED' }, { status: 409 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const userId = searchParams.get('userId');
    const requestedShopId = searchParams.get('shopId');
    const role = searchParams.get('role');

    const skip = (page - 1) * limit;

    const emptyResponse = () => NextResponse.json({
      userRoles: [],
      pagination: {
        page,
        limit,
        total: 0,
        totalPages: 0,
        hasMore: false
      }
    });

    // Build where clause
    const whereClause: any = {};

    if (userId) {
      whereClause.userId = userId;
    }
    if (role) {
      whereClause.role = role;
    }

    let allowedShopIds: string[] = [];

    if (isAdmin) {
      const orgShops = await prisma.shopAuthorization.findMany({
        where: { orgId: activeOrgId },
        select: { id: true }
      });
      allowedShopIds = orgShops.map((shop) => shop.id);
    } else {
      const candidateShopIds = Array.from(
        new Set([
          ...directShopIds,
          ...managedGroupShopIds,
          ...accessibleShopIds
        ].filter(Boolean))
      );

      const scopeFilters: any[] = [];
      if (candidateShopIds.length > 0) {
        scopeFilters.push({ id: { in: candidateShopIds } });
      }
      if (managedGroupIds.length > 0) {
        scopeFilters.push({ groupId: { in: managedGroupIds } });
      }

      if (scopeFilters.length === 0) {
        return emptyResponse();
      }

      const scopedShops = await prisma.shopAuthorization.findMany({
        where: {
          orgId: activeOrgId,
          OR: scopeFilters
        },
        select: { id: true }
      });

      allowedShopIds = scopedShops.map((shop) => shop.id);
    }

    const allowedShopIdSet = new Set(allowedShopIds);

    if (requestedShopId) {
      if (!allowedShopIdSet.has(requestedShopId)) {
        return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
      }
      whereClause.shopId = requestedShopId;
    } else {
      if (allowedShopIds.length === 0) {
        return emptyResponse();
      }
      whereClause.shopId = { in: allowedShopIds };
    }

    // First get the user roles without shop inclusion to avoid null errors
    const allUserRoles = await prisma.userShopRole.findMany({
      where: whereClause,
      select: {
        id: true,
        userId: true,
        shopId: true,
        role: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    // Get total count
    const total = await prisma.userShopRole.count({ where: whereClause });

    // Manually fetch related data with error handling
    const userRolesWithData = await Promise.all(
      allUserRoles.map(async (userRole) => {
        try {
          // Fetch user data
          const user = await prisma.user.findUnique({
            where: { id: userRole.userId },
            select: {
              id: true,
              name: true,
              role: true
            }
          });

          // Fetch shop data with error handling
          let shop = null;
          try {
            shop = await prisma.shopAuthorization.findUnique({
              where: { id: userRole.shopId },
              select: {
                id: true,
                shopId: true,
                shopName: true,
                status: true,
                managedName: true,
                app: {
                  select: {
                    channel: true,
                    appName: true
                  }
                }
              }
            });
          } catch (shopError) {
            console.warn(`Could not fetch shop ${userRole.shopId}:`, shopError);
          }

          return {
            ...userRole,
            user: user || null,
            shop: shop ? {
              ...shop,
              channelName: shop.app?.channel || 'UNKNOWN',
              appName: shop.app?.appName || 'Unknown App'
            } : null
          };
        } catch (error) {
          console.warn(`Error processing user role ${userRole.id}:`, error);
          return {
            ...userRole,
            user: null,
            shop: null
          };
        }
      })
    );

    // Filter out roles where we couldn't get shop data (invalid references)
    const validUserRoles = userRolesWithData.filter(role => role.shop !== null);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      userRoles: validUserRoles,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore: page < totalPages
      },
    });
  } catch (error) {
    console.error('Error fetching user roles:', error);
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json(
      { error: 'Failed to fetch user roles' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(request: NextRequest) {
  try {
    const {
      user: currentUser,
      isAdmin,
      activeOrgId
    } = await getUserWithShopAccess(request, prisma);

    if (!activeOrgId) {
      return NextResponse.json({ error: 'ACTIVE_ORG_REQUIRED' }, { status: 409 });
    }

    const { userId, shopId, role } = await request.json();

    // Validate required fields
    if (!userId || !shopId || !role) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, shopId, role' },
        { status: 400 }
      );
    }

    const shop = await prisma.shopAuthorization.findUnique({
      where: { id: shopId },
      select: {
        id: true,
        shopId: true,
        shopName: true,
        status: true,
        orgId: true,
        groupId: true,
        managedName: true
      }
    });

    if (!shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    const isOrgAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(currentUser.role as string);
    let canManage = isOrgAdmin;

    if (!canManage && shop.groupId) {
      const membership = await prisma.shopGroupMember.findUnique({
        where: {
          groupId_userId: {
            groupId: shop.groupId,
            userId: currentUser.id
          }
        }
      });

      if (membership?.isActive && membership.role === 'MANAGER') {
        canManage = true;
      }
    }

    if (!canManage) {
      return NextResponse.json({ error: 'Only administrators or group managers can assign shop access.' }, { status: 403 });
    }

    if (shop.orgId !== activeOrgId) {
      return NextResponse.json({ error: 'Shop is not part of the active organization' }, { status: 403 });
    }

    // Verify the user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        role: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Enforce organization membership alignment
    const userOrgMembership = await prisma.organizationMember.findFirst({
      where: {
        orgId: shop.orgId,
        userId
      }
    });

    if (!userOrgMembership) {
      return NextResponse.json({ error: 'User does not belong to this organization' }, { status: 400 });
    }

    // Ensure assigned user is part of the shop group if one exists
    if (shop.groupId) {
      const targetMembership = await prisma.shopGroupMember.findUnique({
        where: {
          groupId_userId: {
            groupId: shop.groupId,
            userId
          }
        }
      });

      if (!targetMembership || !targetMembership.isActive) {
        return NextResponse.json({ error: 'User must be an active member of the group that owns this shop' }, { status: 400 });
      }
    }

    // Check if the role already exists
    const existingRole = await prisma.userShopRole.findFirst({
      where: {
        userId,
        shopId
      }
    });

    if (existingRole) {
      return NextResponse.json(
        { error: 'User already has a role for this shop' },
        { status: 409 }
      );
    }

    // Create the user shop role
    const userShopRole = await prisma.userShopRole.create({
      data: {
        userId,
        shopId,
        role
      }
    });

    // Fetch the complete data for response
    const userShopRoleWithData = await prisma.userShopRole.findUnique({
      where: { id: userShopRole.id },
      select: {
        id: true,
        userId: true,
        shopId: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return NextResponse.json({
      userShopRole: {
        ...userShopRoleWithData,
        user,
        shop: {
          id: shop.id,
          shopId: shop.shopId,
          shopName: shop.shopName,
          status: shop.status,
          managedName: shop.managedName
        }
      }
    });
  } catch (error) {
    console.error('Error creating user shop role:', error);
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json(
      { error: 'Failed to create user shop role' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const {
      isAdmin,
      activeOrgId
    } = await getUserWithShopAccess(request, prisma);

    // Only admins can delete user shop roles
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!activeOrgId) {
      return NextResponse.json({ error: 'ACTIVE_ORG_REQUIRED' }, { status: 409 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Missing role ID' },
        { status: 400 }
      );
    }

    // Verify the role exists
    const existingRole = await prisma.userShopRole.findUnique({
      where: { id }
    });

    if (!existingRole) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    const roleShop = await prisma.shopAuthorization.findUnique({
      where: { id: existingRole.shopId },
      select: { orgId: true }
    });

    if (!roleShop || roleShop.orgId !== activeOrgId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete the role
    await prisma.userShopRole.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Role deleted successfully' });
  } catch (error) {
    console.error('Error deleting user shop role:', error);
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json(
      { error: 'Failed to delete user shop role' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}