import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { verifyToken } from "@/lib/auth";
import { resolveOrgContext } from '@/lib/tenant-context';

// Get all users (Admin and Manager only)
export async function GET(request: NextRequest) {
  try {
    // Resolve organization context (also authenticates)
    const orgResult = await resolveOrgContext(request, prisma as any);

    // Super admin must still have an active organization selected to view scoped users
    if (orgResult.superAdmin && !orgResult.org) {
      return NextResponse.json({ error: 'ACTIVE_ORG_REQUIRED' }, { status: 409 });
    }

    if (!orgResult.org) {
      return NextResponse.json({ error: 'ORGANIZATION_CONTEXT_REQUIRED' }, { status: 409 });
    }

    // Check membership role (only OWNER / ADMIN of the active org can list users)
    if (!orgResult.superAdmin) {
      const activeMembership = orgResult.memberships.find(m => m.orgId === orgResult.org!.id);
      if (!activeMembership || !['OWNER', 'ADMIN'].includes(activeMembership.role)) {
        return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
      }
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';

    const skip = (page - 1) * limit;

    // Build membership-scoped where clause referencing user fields
    const membershipWhere: any = { orgId: orgResult.org.id };
    if (search) {
      membershipWhere.user = {
        ...(membershipWhere.user || {}),
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { username: { contains: search, mode: 'insensitive' } },
        ]
      };
    }
    if (role) {
      membershipWhere.user = {
        ...(membershipWhere.user || {}),
        role
      };
    }

    // Query organization members with included user data
    const memberships = await prisma.organizationMember.findMany({
      where: membershipWhere,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            role: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
            createdBy: true,
            creator: {
              select: { id: true, name: true, username: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }, // membership creation time
      skip,
      take: limit
    });

    const totalCount = await prisma.organizationMember.count({ where: membershipWhere });
    const totalPages = Math.ceil(totalCount / limit);

    // Extract users and then load shop roles (keeping previous behavior)
    const baseUsers = memberships.map(m => ({ ...m.user, organizationRole: m.role }));

    const usersWithShopRoles = await Promise.all(
      baseUsers.map(async (user) => {
        try {
          const userShopRoles = await prisma.userShopRole.findMany({
            where: { userId: user.id },
            select: { id: true, role: true, shopId: true }
          });

            const rolesWithShops = await Promise.all(
              userShopRoles.map(async (usrRole) => {
                try {
                  const shop = await prisma.shopAuthorization.findUnique({
                    where: { id: usrRole.shopId },
                    select: {
                      id: true,
                      shopId: true,
                      shopName: true,
                      status: true,
                      app: { select: { channel: true, appName: true } }
                    }
                  });
                  return {
                    id: usrRole.id,
                    role: usrRole.role,
                    shop: shop ? {
                      ...shop,
                      channelName: shop.app?.channel || 'UNKNOWN',
                      appName: shop.app?.appName || 'Unknown App'
                    } : null
                  };
                } catch (e) {
                  console.warn(`Could not fetch shop for role ${usrRole.id}:`, e);
                  return { id: usrRole.id, role: usrRole.role, shop: null };
                }
              })
            );
            const validRoles = rolesWithShops.filter(r => r.shop !== null);
            return { ...user, userShopRoles: validRoles };
        } catch (e) {
          console.warn(`Could not fetch shop roles for user ${user.id}:`, e);
          return { ...user, userShopRoles: [] };
        }
      })
    );

    return NextResponse.json({
      users: usersWithShopRoles,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages,
        hasMore: page < totalPages
      }
    });
  } catch (error) {
    console.error('Error fetching users (org scoped):', error);
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// Create new user (Admin only)
export async function POST(request: NextRequest) {
  try {
    const decoded = verifyToken(request);

    // Get current user
    const currentUser = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!currentUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check if user has permission (Admin only)
    if (!["ADMIN"].includes(currentUser.role)) {
      return NextResponse.json(
        { error: "Only administrators can create users" },
        { status: 403 }
      );
    }

    const { name, username, role, password } = await request.json();

    if (!name || !username || !role || !password) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this username already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = await prisma.user.create({
      data: {
        name,
        username,
        role,
        password: hashedPassword,
      },
      select: {
        id: true,
        name: true,
        role: true,
      },
    });

    return NextResponse.json({ user: newUser }, { status: 201 });
  } catch (error) {
    console.error("Error creating user:", error);
    if (error instanceof Error && error.message === "Authentication required") {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}